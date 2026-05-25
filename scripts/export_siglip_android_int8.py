import argparse
from pathlib import Path

import torch
import executorch.export as ex
from transformers import SiglipModel, SiglipProcessor
from huggingface_hub import hf_hub_download
from torchao.quantization import Int8DynamicActivationInt8WeightConfig, Int8WeightOnlyConfig


MODEL_ID = "google/siglip2-base-patch16-224"


class VisionWrapper(torch.nn.Module):
    def __init__(self, vision_model: torch.nn.Module):
        super().__init__()
        self.vision_model = vision_model

    def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
        outputs = self.vision_model(pixel_values=pixel_values, return_dict=True)
        return outputs.pooler_output


class TextWrapper(torch.nn.Module):
    def __init__(self, text_model: torch.nn.Module):
        super().__init__()
        self.text_model = text_model

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        outputs = self.text_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            return_dict=True,
        )
        return outputs.pooler_output


def load_text_samples(path: Path, limit: int) -> list[str]:
    if not path.exists():
        return []
    lines = [line.strip() for line in path.read_text().splitlines() if line.strip()]
    return lines[:limit]


def build_calibration_samples(
    processor: SiglipProcessor,
    images_dir: Path | None,
    texts_path: Path | None,
    limit: int,
) -> tuple[list[tuple[torch.Tensor]], list[tuple[torch.Tensor, torch.Tensor]]]:
    vision_samples: list[tuple[torch.Tensor]] = []
    text_samples: list[tuple[torch.Tensor, torch.Tensor]] = []

    if images_dir and images_dir.exists():
        from PIL import Image

        for image_path in sorted(images_dir.glob("*"))[:limit]:
            if not image_path.is_file():
                continue
            try:
                image = Image.open(image_path).convert("RGB")
                inputs = processor(images=image, return_tensors="pt")
                vision_samples.append((inputs["pixel_values"],))
            except Exception:
                continue

    texts = load_text_samples(texts_path, limit) if texts_path else []
    if texts:
        inputs = processor(text=texts, return_tensors="pt", padding="max_length", max_length=64)
        for i in range(inputs["input_ids"].shape[0]):
            text_samples.append(
                (inputs["input_ids"][i : i + 1], inputs["attention_mask"][i : i + 1])
            )

    if not vision_samples:
        vision_samples.append((torch.randn(1, 3, 224, 224, dtype=torch.float32),))
    if not text_samples:
        text_samples.append(
            (
                torch.ones(1, 64, dtype=torch.int64),
                torch.ones(1, 64, dtype=torch.int64),
            )
        )

    return vision_samples, text_samples


def export_models(
    output_dir: Path,
    images_dir: Path | None,
    texts_path: Path | None,
    limit: int,
    weight_only: bool,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    tokenizer_path = hf_hub_download(
        repo_id=MODEL_ID,
        filename="tokenizer.json",
        local_dir=output_dir,
    )
    tokenizer_target = output_dir / "siglip2_tokenizer.json"
    if tokenizer_target.resolve() != Path(tokenizer_path).resolve():
        Path(tokenizer_path).replace(tokenizer_target)

    processor = SiglipProcessor.from_pretrained(MODEL_ID)
    model = SiglipModel.from_pretrained(MODEL_ID, torch_dtype=torch.float32)
    model.eval()

    vision = VisionWrapper(model.vision_model).eval()
    text = TextWrapper(model.text_model).eval()

    vision_samples, text_samples = build_calibration_samples(
        processor, images_dir, texts_path, limit
    )

    quant_config = Int8WeightOnlyConfig() if weight_only else Int8DynamicActivationInt8WeightConfig()
    export_recipe = ex.ExportRecipe(
        quantization_recipe=ex.recipe.QuantizationRecipe(
            ao_quantization_configs=[ex.recipe.AOQuantizationConfig(quant_config)]
        ),
        lowering_recipe=ex.recipe.LoweringRecipe(),
        strict=False,
    )

    vision_session = ex.export(
        vision,
        example_inputs=vision_samples,
        name="siglip2_vision_xnnpack_int8",
        artifact_dir=str(output_dir),
        export_recipe=export_recipe,
    )
    vision_session.save_to_pte(str(output_dir / "siglip2_vision_xnnpack_int8.pte"))

    text_session = ex.export(
        text,
        example_inputs=text_samples,
        name="siglip2_text_xnnpack_int8",
        artifact_dir=str(output_dir),
        export_recipe=export_recipe,
    )
    text_session.save_to_pte(str(output_dir / "siglip2_text_xnnpack_int8.pte"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="siglip_android_export_int8")
    parser.add_argument("--calibration-images", default=None)
    parser.add_argument("--calibration-texts", default=None)
    parser.add_argument("--max-calibration", type=int, default=32)
    parser.add_argument("--weight-only", action="store_true")
    args = parser.parse_args()

    export_models(
        Path(args.output_dir),
        Path(args.calibration_images) if args.calibration_images else None,
        Path(args.calibration_texts) if args.calibration_texts else None,
        args.max_calibration,
        args.weight_only,
    )


if __name__ == "__main__":
    torch.set_grad_enabled(False)
    main()
