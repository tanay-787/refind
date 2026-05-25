import argparse
from pathlib import Path

import torch
import executorch.export as ex
from transformers import SiglipModel
from huggingface_hub import hf_hub_download


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


def export_models(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    tokenizer_path = hf_hub_download(
        repo_id=MODEL_ID,
        filename="tokenizer.json",
        local_dir=output_dir,
    )
    tokenizer_target = output_dir / "siglip2_tokenizer.json"
    if tokenizer_target.resolve() != Path(tokenizer_path).resolve():
        Path(tokenizer_path).replace(tokenizer_target)

    model = SiglipModel.from_pretrained(MODEL_ID, torch_dtype=torch.float32)
    model.eval()

    vision = VisionWrapper(model.vision_model).eval()
    text = TextWrapper(model.text_model).eval()

    vision_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)
    text_input_ids = torch.ones(1, 64, dtype=torch.int64)
    text_attention = torch.ones(1, 64, dtype=torch.int64)

    export_recipe = ex.ExportRecipe(
        quantization_recipe=ex.recipe.QuantizationRecipe(),
        lowering_recipe=ex.recipe.LoweringRecipe(),
    )

    vision_session = ex.export(
        vision,
        example_inputs=[(vision_input,)],
        name="siglip2_vision_xnnpack_fp32",
        artifact_dir=str(output_dir),
        export_recipe=export_recipe,
    )
    vision_session.save_to_pte(str(output_dir / "siglip2_vision_xnnpack_fp32.pte"))

    text_session = ex.export(
        text,
        example_inputs=[(text_input_ids, text_attention)],
        name="siglip2_text_xnnpack_fp32",
        artifact_dir=str(output_dir),
        export_recipe=export_recipe,
    )
    text_session.save_to_pte(str(output_dir / "siglip2_text_xnnpack_fp32.pte"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="siglip_android_export_fp32")
    args = parser.parse_args()

    export_models(Path(args.output_dir))


if __name__ == "__main__":
    torch.set_grad_enabled(False)
    main()
