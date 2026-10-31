import type { AminoAcid, FragmentMemo, Peak } from "./types.ts";

/** 端もアミノ酸も大文字。左端は H-、右端は -OH。 */
export function fragmentLabel(memo: FragmentMemo): string {
  const codes = memo.residues.join("");
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
