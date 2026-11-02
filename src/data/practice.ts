import type { Problem, SequenceBuilderProblem, Stage } from "../game/types.ts";
import { aminoAcidCodesByMass } from "./aminoAcids.ts";
import { practiceSpecs, type PracticeFeature, type PracticeSpec } from "./practiceSpecs.ts";

/**
 * 練習問題。チュートリアルとは別に、ホームから好きな問題へ進める。
 * 並びと見せるピークは scripts/generatePractice.ts が決め、practiceSpecs.ts に書き出す。
 */
const featureTitle: Record<PracticeFeature, string> = {
  full: "すべて見える",
  repeat: "同じアミノ酸が入る",
  "no-end1": "端の1つ目が見えない",
  "no-end12": "端の1・2つ目が見えない",
  "no-end1-repeat": "端の1つ目なし・同じアミノ酸",
  gaps: "ピークが欠けている",
  "no-precursor": "切る前が見えない",
  ambiguous: "候補が複数ある",
  ilkq: "L/I・K/Qが入る",
  combo1: "切る前も端も見えない",
  combo2: "総合（欠け・同じアミノ酸・切る前なし）",
};

function featureNote(spec: PracticeSpec): string {
  switch (spec.feature) {
    case "full":
      return "ピークは全部見えています。";
    case "repeat":
      return "ピークは全部見えています。同じアミノ酸が2回以上入っています。";
    case "no-end1":
      return "左右とも、端から1残基分のかけらは見えません。";
    case "no-end12":
      return "左右とも、端から1残基分と2残基分のかけらは見えません。";
    case "no-end1-repeat":
      return "左右とも、端から1残基分のかけらは見えません。同じアミノ酸が2回以上入っています。";
    case "gaps":
      return "いくつかのピークが欠けています。";
    case "no-precursor":
      return "切る前のピークは見えません。";
    case "ambiguous":
      return "ピークが欠けていて、質量の差が1残基にも2残基にも読めるところがあります。";
    case "ilkq":
      return "ピークは全部見えています。L か K が入っています。";
    case "combo1":
      return spec.length === 3
        ? "切る前のピークと、端から1残基分のかけらの片方は見えません。"
        : "切る前のピークと、左右の端から1残基分のかけらは見えません。";
    case "combo2":
      return "切る前のピークが見えず、ほかにも欠けたピークがあります。同じアミノ酸が2回以上入っています。";
  }
}

function buildProblem(spec: PracticeSpec): SequenceBuilderProblem {
  const number = spec.id.slice(spec.id.indexOf("-") + 1).replace(/^0/, "");
  const label = featureTitle[spec.feature];
  const sameMass = /[LK]/.test(spec.sequence)
    ? "L と I、K と Q は質量が同じで、カードは L/I、K/Q の1枚です。置けば正解です。"
    : "";
  const instruction = [
    `${spec.length}残基のペプチドです。ピークは質量だけで、左右の印はありません。見えているピークから、並びを1つに決めてください。`,
    featureNote(spec),
    sameMass,
  ]
    .filter(Boolean)
    .join("");
  return {
    id: spec.id,
    stageId: `practice-${spec.length}`,
    type: "sequence-builder",
    title: `${spec.length}-${number} ${label}`,
    instruction,
    sequence: spec.sequence,
    shownPeakIds: [...spec.shownPeakIds],
    focusPeakIds: [],
    peakLabelStyle: "depth",
    availableAminoAcids: aminoAcidCodesByMass,
    correctSequence: spec.sequence,
    deduce: { features: [label] },
    explanation: `見えているピークをすべて説明できる並びは、${spec.length}残基ではこの1つだけです。`,
    hint:
      "左のかけらと右のかけらを足すと、切る前 + 1 になる組があります。見えないところは、隣り合うピークの差が1残基か2残基かを考えます。",
  };
}

export const practiceProblems: Problem[] = practiceSpecs.map(buildProblem);

const lengths = [...new Set(practiceSpecs.map((spec) => spec.length))];

export const practiceStages: Stage[] = lengths.map((length) => ({
  id: `practice-${length}`,
  title: `${length}残基`,
  summary: `${length}残基のペプチドを、特徴の違う10問で読みます。`,
  problemIds: practiceProblems
    .filter((problem) => problem.stageId === `practice-${length}`)
    .map((problem) => problem.id),
}));
