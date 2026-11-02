import type { AminoAcid } from "./types.ts";

export type TrayCard = {
  key: string;
  code: string;
  acid: AminoAcid;
};

/** 同じ質量の組は、両方配られているときだけ1つのボタンにする。 */
const sameMassGroups = [
  { members: ["L", "I"], label: "L/I", nameJa: "ロイシン / イソロイシン" },
  { members: ["K", "Q"], label: "K/Q", nameJa: "リジン / グルタミン" },
] as const;

export function trayCards(codes: readonly string[], acids: readonly AminoAcid[]): TrayCard[] {
  const present = new Set(codes);
  const consumed = new Set<string>();
  const cards: TrayCard[] = [];

  for (const group of sameMassGroups) {
    if (!group.members.every((code) => present.has(code))) continue;
    const sample = acids.find((acid) => acid.code === group.members[0]);
    if (!sample) continue;
    for (const code of group.members) consumed.add(code);
    cards.push({
      key: group.label,
      code: group.label,
      acid: { code: group.label, nameJa: group.nameJa, residueMass: sample.residueMass },
    });
  }

  for (const code of codes) {
    if (consumed.has(code)) continue;
    const acid = acids.find((item) => item.code === code);
    if (!acid) continue;
    cards.push({ key: code, code, acid });
  }

  cards.sort(
    (left, right) =>
      left.acid.residueMass - right.acid.residueMass ||
      left.code.localeCompare(right.code, "en"),
  );
  return cards;
}
