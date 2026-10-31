import type { AminoAcid } from "../game/types.ts";

export const aminoAcids: AminoAcid[] = [
  { code: "G", nameJa: "グリシン", residueMass: 57 },
  { code: "A", nameJa: "アラニン", residueMass: 71 },
  { code: "S", nameJa: "セリン", residueMass: 87 },
  { code: "P", nameJa: "プロリン", residueMass: 97 },
  { code: "V", nameJa: "バリン", residueMass: 99 },
  { code: "T", nameJa: "スレオニン", residueMass: 101 },
  { code: "C", nameJa: "システイン", residueMass: 103 },
  { code: "I", nameJa: "イソロイシン", residueMass: 113 },
  { code: "L", nameJa: "ロイシン", residueMass: 113 },
  { code: "N", nameJa: "アスパラギン", residueMass: 114 },
  { code: "D", nameJa: "アスパラギン酸", residueMass: 115 },
  { code: "Q", nameJa: "グルタミン", residueMass: 128 },
  { code: "K", nameJa: "リジン", residueMass: 128 },
  { code: "E", nameJa: "グルタミン酸", residueMass: 129 },
  { code: "M", nameJa: "メチオニン", residueMass: 131 },
  { code: "H", nameJa: "ヒスチジン", residueMass: 137 },
  { code: "F", nameJa: "フェニルアラニン", residueMass: 147 },
  { code: "R", nameJa: "アルギニン", residueMass: 156 },
  { code: "Y", nameJa: "チロシン", residueMass: 163 },
  { code: "W", nameJa: "トリプトファン", residueMass: 186 },
];

/** 序盤の組み合わせ問題は、この5種類だけを配る。 */
const earlyCodes = ["G", "A", "S", "P", "V"];

export const earlyChoices = earlyCodes.map((code) => ({
  id: code,
  sequence: code,
}));
