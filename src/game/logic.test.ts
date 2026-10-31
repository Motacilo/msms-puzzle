import { describe, expect, it } from "vitest";
import { aminoAcids } from "../data/aminoAcids.ts";
import { briefings } from "../data/briefings.ts";
import { problems } from "../data/problems.ts";
import { stages } from "../data/stages.ts";
import { assessAnswer } from "./evaluateAnswer.ts";
import { explainSolution } from "./explainSolution.ts";
import { fragmentLabel } from "./labels.ts";
import { buildPeptide } from "./fragments.ts";
import { continueTarget, isProblemOpen, isStageOpen, nextFlowId, nextUnclearedId } from "./progression.ts";
import { readShownPeaks } from "./readSequence.ts";
import { validateAll } from "./validateProblem.ts";
import { CANNOT_BUILD, type Problem } from "./types.ts";

describe("かけらの質量", () => {
  it("GAS は左右の端と、相補な組が切る前より 1 大きい", () => {
    const built = buildPeptide("GAS", aminoAcids);
    expect(built.residueSum).toBe(215);
    expect(built.intactMass).toBe(234);
    expect(mass(built, "left-1")).toBe(58);
    expect(mass(built, "left-2")).toBe(129);
    expect(mass(built, "right-1")).toBe(106);
    expect(mass(built, "right-2")).toBe(177);
    const again = buildPeptide("GAS", aminoAcids);
    const heights = built.peaks.map((peak) => peak.intensity);
    expect(heights.every((height) => height > 0.3 && height <= 1)).toBe(true);
    expect(new Set(heights).size).toBeGreaterThan(1);
    expect(again.peaks.map((peak) => peak.intensity)).toEqual(heights);

    const length = built.sequence.length;
    for (let depth = 1; depth < length; depth += 1) {
      const left = mass(built, `left-${depth}`);
      const right = mass(built, `right-${length - depth}`);
      expect(left + right).toBe(built.intactMass + 1);
    }
  });

  it("右のかけらがない SAG でも、左端・差・残基合計から一意に読める", () => {
    const built = buildPeptide("SAG", aminoAcids);
    const shown = built.peaks.filter((peak) =>
      ["intact", "left-1", "left-2"].includes(peak.id),
    );
    const readings = readShownPeaks(3, shown);
    expect(readings.map((reading) => reading.mass)).toEqual([87, 71, 57]);
  });
});

describe("かけらメモ", () => {
  it("端もアミノ酸も大文字で、H-GS と SA-OH と書く", () => {
    expect(
      fragmentLabel({ residues: ["G", "S"], hydrogen: true, hydroxyl: false }),
    ).toBe("H-GS");
    expect(
      fragmentLabel({ residues: ["S", "A"], hydrogen: false, hydroxyl: true }),
    ).toBe("SA-OH");
    expect(
      fragmentLabel({ residues: ["G", "A", "S"], hydrogen: true, hydroxyl: true }),
    ).toBe("H-GAS-OH");
    expect(
      fragmentLabel({ residues: ["G"], hydrogen: false, hydroxyl: false }),
    ).toBe("G");
  });
});

describe("回答判定", () => {
  const choice = problems.find((problem) => problem.id === "difference-left");
  const sequence = problems.find((problem) => problem.id === "restore-asg");
  const water = problems.find((problem) => problem.id === "precursor-water");
  const charge = problems.find((problem) => problem.id === "precursor-charge");
  if (
    !choice ||
    choice.type !== "choice" ||
    !sequence ||
    sequence.type !== "sequence-builder" ||
    !water ||
    water.type !== "choice" ||
    !charge ||
    charge.type !== "choice"
  ) {
    throw new Error("テスト用の問題がありません");
  }

  it("未入力では正誤を出さない", () => {
    expect(assessAnswer(choice, { choiceId: null, placed: [] }).status).toBe(
      "incomplete",
    );
    expect(assessAnswer(sequence, { choiceId: null, placed: ["A"] }).status).toBe(
      "incomplete",
    );
  });

  it("選択式と並べる式を、文字列の一致で判定する", () => {
    expect(
      assessAnswer(choice, { choiceId: "A", placed: [] }).status,
    ).toBe("correct");
    expect(
      assessAnswer(choice, { choiceId: "G", placed: [] }).status,
    ).toBe("incorrect");
    expect(
      assessAnswer(sequence, { choiceId: null, placed: ["A", "S", "G"] }).status,
    ).toBe("correct");
    expect(
      assessAnswer(sequence, { choiceId: null, placed: ["A", "G", "S"] }).status,
    ).toBe("incorrect");
    expect(assessAnswer(water, { choiceId: CANNOT_BUILD, placed: [] }).status).toBe(
      "correct",
    );
    expect(
      assessAnswer(water, { choiceId: null, placed: ["G", "A", "S"] }).status,
    ).toBe("incorrect");
    expect(
      assessAnswer(charge, { choiceId: null, placed: ["S", "A", "G"] }).status,
    ).toBe("correct");
    expect(assessAnswer(charge, { choiceId: CANNOT_BUILD, placed: [] }).status).toBe(
      "incorrect",
    );
  });
});

describe("問題データ", () => {
  it("序盤の問題はピークと正解が矛盾しない", () => {
    expect(validateAll(problems, stages, aminoAcids, briefings)).toEqual([]);
  });

  it("差の正解を別の残基にすると検証が失敗する", () => {
    const broken: Problem[] = problems.map((problem) =>
      problem.id === "difference-left"
        ? { ...problem, correctChoiceId: "G" }
        : problem,
    );
    const errors = validateAll(broken, stages, aminoAcids, briefings);
    expect(errors.some((error) => error.includes("difference-left"))).toBe(true);
  });

  it("解説は、質問された計算だけを選んで出す", () => {
    const differenceProblem = problems.find((problem) => problem.id === "difference-left");
    if (!differenceProblem) throw new Error("問題がありません");
    const difference = explainSolution(differenceProblem, aminoAcids);
    expect(difference).toHaveLength(1);
    expect(difference[0]?.equation).toContain("129 − 58 = 71");
    expect(difference[0]?.equation).toContain("アラニン");

    const oneSided = problems.find((problem) => problem.id === "restore-sag-left");
    if (!oneSided) throw new Error("問題がありません");
    const steps = explainSolution(oneSided, aminoAcids).map((step) => step.equation);
    expect(steps.some((step) => step.includes("88 − 1 = 87"))).toBe(true);
    expect(steps.some((step) => step.includes("159 − 88 = 71"))).toBe(true);
    expect(steps.some((step) => step.includes("57"))).toBe(true);
  });

  it("234 は残基と水だけでは届かず、電荷の1で G・A・S になる", () => {
    const water = problems.find((problem) => problem.id === "precursor-water");
    const charge = problems.find((problem) => problem.id === "precursor-charge");
    if (!water || !charge) throw new Error("問題がありません");
    const waterSteps = explainSolution(water, aminoAcids).map((step) => step.equation);
    expect(waterSteps).toContain("G 57 + A 71 + S 87 = 215");
    expect(waterSteps).toContain("215 + 18 = 233");
    expect(waterSteps).toContain("234 − 233 = 1");
    const chargeSteps = explainSolution(charge, aminoAcids).map((step) => step.equation);
    expect(chargeSteps).toContain("215 + 18 = 233");
    expect(chargeSteps).toContain("233 + 1 = 234");
    expect(water.shownPeakIds).toEqual(["intact"]);
    expect(charge.shownPeakIds).toEqual(["intact"]);
  });
});

describe("左右を自分で決める", () => {
  it("SGA は印がなくても、235 の組と端の引き算で一意に読める", () => {
    const built = buildPeptide("SGA", aminoAcids);
    expect(built.intactMass).toBe(234);
    expect(mass(built, "left-1")).toBe(88);
    expect(mass(built, "left-2")).toBe(145);
    expect(mass(built, "right-1")).toBe(90);
    expect(mass(built, "right-2")).toBe(147);
    expect(mass(built, "left-1") + mass(built, "right-2")).toBe(built.intactMass + 1);

    const complement = problems.find((problem) => problem.id === "complement-sga");
    const cap = problems.find((problem) => problem.id === "cap-sga");
    const unlabeled = problems.find((problem) => problem.id === "unlabeled-sga");
    if (!complement || !cap || !unlabeled) throw new Error("問題がありません");
    if (complement.type !== "choice" || cap.type !== "choice") throw new Error("選択式ではありません");

    const pair = explainSolution(complement, aminoAcids).map((step) => step.equation);
    expect(pair).toContain("88 + 147 = 235");
    expect(pair).toContain("234 + 1 = 235");
    expect(complement.instruction).not.toContain("左端から");
    expect(complement.instruction).not.toContain("右端から");

    const caps = explainSolution(cap, aminoAcids).map((step) => step.equation);
    expect(caps).toContain("88 − 1 = 87 → S（セリン）");
    expect(caps).toContain("88 − 19 = 69（アミノ酸にならない）");
    expect(assessAnswer(cap, { choiceId: "left", placed: [] }).status).toBe("correct");
    expect(assessAnswer(cap, { choiceId: "right", placed: [] }).status).toBe("incorrect");

    expect(unlabeled.instruction).not.toContain("左端から");
    expect(unlabeled.instruction).not.toContain("右端から");
    const readings = readShownPeaks(unlabeled.sequence.length, built.peaks);
    expect(readings.map((reading) => reading.mass)).toEqual([87, 57, 71]);
  });

  it("GASV は右端の1本が無くても、残基合計との差2で V になり P にはならない", () => {
    const built = buildPeptide("GASV", aminoAcids);
    const proline = buildPeptide("GASP", aminoAcids);
    expect(built.intactMass).toBe(333);
    expect(proline.intactMass).toBe(331);
    expect(mass(built, "right-1")).toBe(118);
    expect(mass(proline, "right-1")).toBe(116);

    const problem = problems.find((item) => item.id === "missing-gasv");
    if (!problem || problem.type !== "sequence-builder") throw new Error("問題がありません");
    expect(problem.shownPeakIds).not.toContain("right-1");
    expect(problem.availableAminoAcids).toEqual(expect.arrayContaining(["P", "V"]));
    expect(problem.instruction).not.toContain("左端から");
    expect(problem.instruction).not.toContain("右端から");

    const shown = built.peaks.filter((peak) => problem.shownPeakIds.includes(peak.id));
    expect(readShownPeaks(4, shown).map((reading) => reading.mass)).toEqual([57, 71, 87, 99]);
    const steps = explainSolution(problem, aminoAcids).map((step) => step.equation);
    expect(steps.some((step) => step.includes("314") && step.includes("99"))).toBe(true);

    expect(assessAnswer(problem, { choiceId: null, placed: ["G", "A", "S", "V"] }).status).toBe(
      "correct",
    );
    expect(assessAnswer(problem, { choiceId: null, placed: ["G", "A", "S", "P"] }).status).toBe(
      "incorrect",
    );
  });
});

describe("16種類とタンパク質", () => {
  it("整数で一意な残基は16種類で、同じ質量は I/L と K/Q だけ", () => {
    const unique = ["G", "A", "S", "P", "V", "T", "C", "N", "D", "E", "M", "H", "F", "R", "Y", "W"];
    const masses = unique.map((code) => aminoAcids.find((acid) => acid.code === code)?.residueMass);
    expect(masses).toEqual([57, 71, 87, 97, 99, 101, 103, 114, 115, 129, 131, 137, 147, 156, 163, 186]);
    expect(new Set(masses).size).toBe(16);
    expect(aminoAcids.find((acid) => acid.code === "I")?.residueMass).toBe(113);
    expect(aminoAcids.find((acid) => acid.code === "L")?.residueMass).toBe(113);
    expect(aminoAcids.find((acid) => acid.code === "K")?.residueMass).toBe(128);
    expect(aminoAcids.find((acid) => acid.code === "Q")?.residueMass).toBe(128);
  });

  it("T は残基合計との差が101、切れた端の128は K として照合する", () => {
    const gat = buildPeptide("GAT", aminoAcids);
    const shown = gat.peaks.filter((peak) =>
      ["intact", "left-1", "left-2", "right-2"].includes(peak.id),
    );
    expect(readShownPeaks(3, shown).map((reading) => reading.mass)).toEqual([57, 71, 101]);
    expect(buildPeptide("GAV", aminoAcids).intactMass).toBe(gat.intactMass - 2);

    const cut = problems.find((problem) => problem.id === "cut-resolve");
    const open = problems.find((problem) => problem.id === "isobar-open");
    const internal = problems.find((problem) => problem.id === "main-internal");
    if (!cut || cut.type !== "protein" || !open || open.type !== "protein") {
      throw new Error("問題がありません");
    }
    if (!internal || internal.type !== "protein") throw new Error("問題がありません");
    expect(
      assessAnswer(open, { choiceId: null, placed: [], selectedIds: ["aka", "ao"] }).status,
    ).toBe("correct");
    expect(
      assessAnswer(cut, { choiceId: null, placed: [], selectedIds: ["aka"] }).status,
    ).toBe("correct");
    expect(
      assessAnswer(cut, { choiceId: null, placed: [], selectedIds: ["aka", "ao"] }).status,
    ).toBe("incorrect");
    expect(
      assessAnswer(internal, { choiceId: null, placed: [], selectedIds: ["aka", "ao"] }).status,
    ).toBe("correct");

    const one = problems.find((problem) => problem.id === "protein-one");
    const two = problems.find((problem) => problem.id === "protein-two");
    const narrow = problems.find((problem) => problem.id === "isobar-narrow");
    if (!one || one.type !== "protein" || !two || two.type !== "protein") {
      throw new Error("問題がありません");
    }
    if (!narrow || narrow.type !== "protein") throw new Error("問題がありません");
    expect(one.observedMasses).toEqual([257]);
    expect(one.peptideEnds).toEqual(["n"]);
    expect(
      assessAnswer(one, { choiceId: null, placed: [], selectedIds: ["aka", "ao"] }).status,
    ).toBe("correct");
    expect(
      assessAnswer(one, { choiceId: null, placed: [], selectedIds: ["aka", "ao", "kii"] }).status,
    ).toBe("incorrect");
    expect(
      assessAnswer(one, { choiceId: null, placed: [], selectedIds: ["kii"] }).status,
    ).toBe("incorrect");
    expect(two.observedMasses).toEqual([257, 379]);
    expect(
      assessAnswer(two, { choiceId: null, placed: [], selectedIds: ["aka"] }).status,
    ).toBe("correct");
    expect(narrow.observedMasses).toEqual([276, 379]);

    const fry = problems.find((problem) => problem.id === "seq-fry");
    const repeat = problems.find((problem) => problem.id === "seq-hmw");
    const lysine = problems.find((problem) => problem.id === "seq-gak");
    if (!fry || fry.type !== "sequence-builder") throw new Error("問題がありません");
    if (!repeat || repeat.type !== "sequence-builder") throw new Error("問題がありません");
    if (!lysine || lysine.type !== "sequence-builder") throw new Error("問題がありません");
    expect(fry.availableAminoAcids).toEqual(["G", "A", "S", "P", "V", "F", "R", "Y"]);
    expect(repeat.correctSequence).toBe("WHW");
    expect(repeat.availableAminoAcids).toEqual(expect.arrayContaining(["G", "H", "M", "W"]));
    expect(repeat.availableAminoAcids).not.toEqual(expect.arrayContaining(["K"]));
    expect(lysine.availableAminoAcids).toEqual(
      expect.arrayContaining(["G", "A", "S", "P", "V", "F", "W", "T", "N", "K"]),
    );
    expect(
      assessAnswer(repeat, { choiceId: null, placed: ["W", "H", "W"] }).status,
    ).toBe("correct");
    expect(
      assessAnswer(repeat, { choiceId: null, placed: ["H", "M", "W"] }).status,
    ).toBe("incorrect");
  });
});

describe("進行", () => {
  it("未完了の先頭へ戻れる", () => {
    expect(
      continueTarget(stages, problems, {
        clearedProblemIds: [],
        lastProblemId: null,
      }),
    ).toBe("brief-protein");
    expect(isProblemOpen("precursor-water", stages, [])).toBe(false);
    expect(isProblemOpen("precursor-water", stages, ["brief-protein"])).toBe(true);
    expect(isProblemOpen("precursor-water", stages, ["precursor-water"])).toBe(true);
    expect(nextFlowId(stages, "precursor-charge")).toBe("brief-fragments");
    expect(nextFlowId(stages, "seq-aem")).toBe("brief-digest");
    const stageOne = stages.find((stage) => stage.id === "stage-precursor");
    if (!stageOne) throw new Error("ステージがありません");
    expect(
      continueTarget(stages, problems, {
        clearedProblemIds: ["brief-protein", ...stageOne.problemIds],
        lastProblemId: null,
      }),
    ).toBe("brief-fragments");
    expect(nextUnclearedId(stages, ["brief-protein"], "brief-protein")).toBe("precursor-water");
    const target = continueTarget(stages, problems, {
      clearedProblemIds: [
        "brief-protein",
        "brief-fragments",
        "precursor-water",
        "precursor-charge",
        "difference-left",
      ],
      lastProblemId: "difference-left",
    });
    expect(target).toBe("left-end");
    const order = stages.find((stage) => stage.id === "stage-order");
    if (!order) throw new Error("ステージがありません");
    expect(
      isStageOpen(order, stages, ["difference-left", "left-end", "right-end"]),
    ).toBe(false);

    const earlier = stages
      .filter((stage) =>
        ["stage-precursor", "stage-difference", "stage-order"].includes(stage.id),
      )
      .flatMap((stage) => stage.problemIds);
    expect(
      continueTarget(stages, problems, {
        clearedProblemIds: ["brief-protein", "brief-fragments", ...earlier],
        lastProblemId: null,
      }),
    ).toBe("complement-sga");
    const sides = stages.find((stage) => stage.id === "stage-sides");
    const gap = stages.find((stage) => stage.id === "stage-gap");
    if (!sides || !gap) throw new Error("ステージがありません");
    expect(isStageOpen(sides, stages, earlier)).toBe(true);
    expect(isStageOpen(gap, stages, earlier)).toBe(false);
    expect(isStageOpen(gap, stages, [...earlier, ...sides.problemIds])).toBe(true);
  });
});

function mass(built: ReturnType<typeof buildPeptide>, id: string): number {
  const peak = built.peaks.find((item) => item.id === id);
  if (!peak) throw new Error(id);
  return peak.mass;
}
