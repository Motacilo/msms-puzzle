import type { AminoAcid, FragmentMemo, Peak } from "./types.ts";

/** 質量が同じ L/I、K/Q は、並びの中で区切りが分かるように括弧で囲む。 */
export function displayCode(code: string): string {
  return code.includes("/") ? `(${code})` : code;
}

/**
 * 文字にした表示（読み上げや重複の判定に使う）。端もアミノ酸も大文字。左端は H-、右端は -OH。
 * 画面の表示は FragmentLabel が構造から描くので、ヒスチジンの H と取り違えない。
 */
export function fragmentLabel(memo: FragmentMemo): string {
  const codes = memo.residues.map(displayCode).join("");
  if (!memo.hydrogen && !memo.hydroxyl) return codes;
  if (memo.hydrogen && memo.hydroxyl) return `H-${codes}-OH`;
  if (memo.hydrogen) return `H-${codes}`;
  return `${codes}-OH`;
}

export function residueLabel(
  code: string,
  table: readonly AminoAcid[],
): string {
  const acid = table.find((item) => item.code === code);
  return acid ? `${code}（${acid.nameJa}）` : code;
}

export function sequenceLabel(
  sequence: string,
  table: readonly AminoAcid[],
): string {
  return [...sequence].map((code) => residueLabel(code, table)).join(" – ");
}

export function peakCaption(peak: Peak, style: "side" | "depth"): string {
  if (peak.side === "intact") return "切る前";
  if (style === "side") {
    return peak.side === "left" ? "左のかけら" : "右のかけら";
  }
  return peak.side === "left"
    ? `左端から${peak.depth}残基分`
    : `右端から${peak.depth}残基分`;
}

export function acidByCode(
  code: string,
  table: readonly AminoAcid[],
): AminoAcid | undefined {
  return table.find((item) => item.code === code);
}

export function acidByMass(
  mass: number,
  table: readonly AminoAcid[],
): AminoAcid | undefined {
  return table.find((item) => item.residueMass === mass);
}
