import type { PeakColor } from "./types.ts";

/** ピークに付けられる色の一覧。黒以外は、やや薄めの色で描く。 */
export const PEAK_COLORS: readonly { id: PeakColor; nameJa: string }[] = [
  { id: "black", nameJa: "黒" },
  { id: "blue", nameJa: "青" },
  { id: "green", nameJa: "緑" },
  { id: "orange", nameJa: "橙" },
  { id: "pink", nameJa: "桃" },
  { id: "purple", nameJa: "紫" },
];

export function isPeakColor(value: unknown): value is PeakColor {
  return PEAK_COLORS.some((color) => color.id === value);
}
