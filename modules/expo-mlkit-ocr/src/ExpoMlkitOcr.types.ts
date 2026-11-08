export interface OcrFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrElement {
  text: string;
  frame: OcrFrame;
}

export interface OcrLine {
  text: string;
  frame: OcrFrame;
  elements?: OcrElement[];
}

export interface OcrBlock {
  text: string;
  frame: OcrFrame;
  lines: OcrLine[];
}

export interface OcrResult {
  text: string;
  blocks: OcrBlock[];
}

export type DetectorType = 'latin' | 'devanagari';
