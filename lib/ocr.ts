import Tesseract from 'tesseract.js';

export type OcrResult = {
  rawText: string;
  nikCandidates: string[];
};

const NIK_REGEX = /(?:(?:NIK|N1K|N I K)[^\d]{0,3})?([0-9]{15,16})/gi;

export function normalizeNik(input: string): string | null {
  const justDigits = input.replace(/\D/g, '');
  if (justDigits.length === 16) return justDigits;
  if (justDigits.length === 15) return justDigits; // toleransi, beberapa OCR kehilangan 1 digit leading zero
  return null;
}

export async function runOcrOnCanvas(canvas: HTMLCanvasElement): Promise<OcrResult> {
  // Konfigurasi whitelist angka & huruf yang sering keliru
  const { data } = await Tesseract.recognize(canvas, 'eng', {
    tessedit_char_whitelist: '0123456789NIK',
    // PS: tesseract.js menaruh config di params, tapi beberapa versi terabaikan; tetap memberi efek pada model eng
  } as any);

  const rawText = (data?.text || '').toUpperCase();
  const candidates: string[] = [];
  for (const match of rawText.matchAll(NIK_REGEX)) {
    const nikMaybe = normalizeNik(match[1]);
    if (nikMaybe) candidates.push(nikMaybe);
  }
  return { rawText, nikCandidates: Array.from(new Set(candidates)) };
}
