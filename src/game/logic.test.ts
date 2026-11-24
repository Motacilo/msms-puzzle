import { describe, expect, it } from "vitest";
import { aminoAcidCodesByMass, aminoAcids } from "../data/aminoAcids.ts";
import { trayCards } from "./tray.ts";
import { briefings } from "../data/briefings.ts";
import { problems } from "../data/problems.ts";
import { stages } from "../data/stages.ts";
import { answerFragments, explainedPeakIds } from "./answerFragments.ts";
import { assessAnswer } from "./evaluateAnswer.ts";
import { explainSolution } from "./explainSolution.ts";
import { fragmentLabel } from "./labels.ts";
import { buildPeptide, selectPeaks } from "./fragments.ts";
import { continueTarget, isProblemOpen, nextFlowId } from "./progression.ts";
import { readShownPeaks } from "./readSequence.ts";
import { validateAll } from "./validateProblem.ts";
import {
  backspace,
  evaluate,
  pressAcid,
  pressConstant,
  pressDigit,
  pressEquals,
  pressOperator,
  type Token,
} from "./calculator.ts";
import { practiceProblems, practiceStages } from "../data/practice.ts";
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

describe("残基", () => {
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

    const fry = problems.find((problem) => problem.id === "seq-fry");
    const repeat = problems.find((problem) => problem.id === "seq-hmw");
    const lysine = problems.find((problem) => problem.id === "seq-gak");
    if (!fry || fry.type !== "sequence-builder") throw new Error("問題がありません");
    if (!repeat || repeat.type !== "sequence-builder") throw new Error("問題がありません");
    if (!lysine || lysine.type !== "sequence-builder") throw new Error("問題がありません");
    expect(fry.availableAminoAcids).toEqual(["G", "A", "S", "P", "V", "F", "R", "Y"]);
    expect(repeat.correctSequence).toBe("WHW");
    expect(repeat.availableAminoAcids).toEqual(aminoAcidCodesByMass);
    expect(trayCards(repeat.availableAminoAcids, aminoAcids).map((card) => card.code)).toEqual([
      "G",
      "A",
      "S",
      "P",
      "V",
      "T",
      "C",
      "L/I",
      "N",
      "D",
      "K/Q",
      "E",
      "M",
      "H",
      "F",
      "R",
      "Y",
      "W",
    ]);
    expect(lysine.availableAminoAcids).toEqual(["G", "A", "S", "P", "V", "H", "M", "W", "K"]);
    expect(
      assessAnswer(repeat, { choiceId: null, placed: ["W", "H", "W"] }).status,
    ).toBe("correct");
    expect(
      assessAnswer(repeat, { choiceId: null, placed: ["H", "M", "W"] }).status,
    ).toBe("incorrect");
  });
});

describe("進行", () => {
  it("ペプチドを読む図から始まる", () => {
    expect(
      continueTarget(stages, problems, {
        clearedProblemIds: [],
        lastProblemId: null,
      }),
    ).toBe("brief-fragments");
    expect(isProblemOpen("assemble-gas", stages, [])).toBe(false);
    expect(isProblemOpen("assemble-gas", stages, ["brief-fragments"])).toBe(true);
    expect(isProblemOpen("left-end", stages, ["brief-fragments"])).toBe(false);
    expect(nextFlowId(stages, "assemble-gas")).toBe("restore-asg");
    expect(nextFlowId(stages, "restore-asg")).toBe("seq-hmw");
    expect(nextFlowId(stages, "seq-hmw")).toBe(null);
  });
});

function mass(built: ReturnType<typeof buildPeptide>, id: string): number {
  const peak = built.peaks.find((item) => item.id === id);
  if (!peak) throw new Error(id);
  return peak.mass;
}

describe("練習問題", () => {
  it("3〜7残基を10問ずつ持つ", () => {
    expect(practiceStages.map((stage) => stage.problemIds.length)).toEqual([10, 10, 10, 10, 10]);
    expect(practiceProblems.map((problem) => problem.sequence.length)).toEqual(
      [3, 4, 5, 6, 7].flatMap((length) => Array(10).fill(length)),
    );
  });

  it("見えているピークに合う並びが、どの問題でも1つに決まる", () => {
    expect(validateAll(practiceProblems, practiceStages, aminoAcids, [])).toEqual([]);
  });

  it("質量が同じ L/I と K/Q は、どちらのカードでも正解になる", () => {
    const problem = practiceProblems.find((item) => /[LK]/.test(item.sequence));
    if (!problem || problem.type !== "sequence-builder") throw new Error("問題がありません");
    const placed = [...problem.correctSequence].map((code) =>
      code === "L" ? "L/I" : code === "K" ? "K/Q" : code,
    );
    expect(assessAnswer(problem, { choiceId: null, placed }).status).toBe("correct");
  });
});

describe("電卓", () => {
  const typed = (text: string, start: Token[] = []): Token[] =>
    [...text].reduce<Token[]>((tokens, ch) => {
      if ("+−×÷".includes(ch)) return pressOperator(tokens, ch as "+" | "−" | "×" | "÷");
      return pressDigit(tokens, ch);
    }, start);

  it("四則演算で、かけ算とわり算を先に計算する", () => {
    expect(evaluate(typed("12+3×4"))).toBe(24);
    expect(evaluate(typed("100−30÷5"))).toBe(94);
    expect(evaluate(typed("7÷2"))).toBe(3.5);
  });

  it("式が空のときと、0 でわるときは結果が出ない", () => {
    expect(evaluate([])).toBeNull();
    expect(evaluate(typed("5÷0"))).toBeNull();
  });

  it("右端が演算子のときは、その演算子を無視した値が出る", () => {
    expect(evaluate(typed("12+"))).toBe(12);
    expect(evaluate(typed("12+3×"))).toBe(15);
    expect(evaluate(typed("8÷"))).toBe(8);
    expect(evaluate(typed("+"))).toBeNull();
  });

  it("アミノ酸は残基質量として計算し、続けて押すと + が入る", () => {
    let tokens = pressAcid([], "G", 57);
    tokens = pressAcid(tokens, "A", 71);
    tokens = pressAcid(tokens, "S", 87);
    expect(tokens.map((token) => (token.kind === "op" ? token.op : token.kind))).toEqual([
      "acid",
      "+",
      "acid",
      "+",
      "acid",
    ]);
    expect(evaluate(tokens)).toBe(215);
    tokens = pressConstant(pressOperator(tokens, "+"), "19");
    expect(evaluate(tokens)).toBe(234);
  });

  it("通常の数字とアミノ酸を混ぜた式も、そのまま計算できる", () => {
    let tokens = pressAcid([], "K/Q", 128);
    tokens = pressOperator(tokens, "−");
    tokens = pressDigit(tokens, "1");
    tokens = pressDigit(tokens, "9");
    expect(evaluate(tokens)).toBe(109);
  });

  it("バックスペースは数字を1桁ずつ、アミノ酸や演算子は1つずつ消す", () => {
    const tokens = typed("123+");
    expect(backspace(tokens)).toEqual(typed("123"));
    expect(backspace(backspace(tokens))).toEqual(typed("12"));
    expect(backspace([])).toEqual([]);
  });

  it("= で式が結果の数1つになる", () => {
    const tokens = pressEquals(typed("12+3×4"));
    expect(tokens).toEqual([{ kind: "num", text: "24", typed: false }]);
    expect(pressEquals(typed("12+"))).toEqual([{ kind: "num", text: "12", typed: false }]);
  });
});

describe("メモの表示", () => {
  it("L/I と K/Q は括弧で囲む", () => {
    expect(
      fragmentLabel({ residues: ["G", "L/I", "A", "K/Q"], hydrogen: false, hydroxyl: false }),
    ).toBe("G(L/I)A(K/Q)");
    expect(fragmentLabel({ residues: ["K/Q"], hydrogen: true, hydroxyl: true })).toBe("H-(K/Q)-OH");
  });

  it("ヒスチジンと端の H・OH を取り違えない", () => {
    // 文字にすると「H-OH」で同じに見えるが、構造は別。画面は構造から描く。
    const histidineOh = { residues: ["H"], hydrogen: false, hydroxyl: true };
    const capsOnly = { residues: [], hydrogen: true, hydroxyl: true };
    expect(histidineOh.residues).toEqual(["H"]);
    expect(histidineOh.hydrogen).toBe(false);
    expect(fragmentLabel(histidineOh)).not.toBe(fragmentLabel(capsOnly));
  });
});

describe("回答のかけら（結果画面の演出）", () => {
  it("GAS を切ると、質量の小さい順に 58・106・129・177・234 になる", () => {
    const fragments = answerFragments([..."GAS"], aminoAcids);
    expect(fragments.map((fragment) => fragment.mass)).toEqual([58, 106, 129, 177, 234]);
    expect(fragments.map((fragment) => fragment.id)).toEqual([
      "left-1",
      "right-1",
      "left-2",
      "right-2",
      "intact",
    ]);
    const left2 = fragments.find((fragment) => fragment.id === "left-2");
    expect([left2?.from, left2?.to]).toEqual([0, 2]);
    const right2 = fragments.find((fragment) => fragment.id === "right-2");
    expect([right2?.from, right2?.to]).toEqual([1, 3]);
  });

  it("L/I と K/Q のカードは、L と K として質量を数える", () => {
    const card = answerFragments(["G", "L/I", "K/Q"], aminoAcids).map((fragment) => fragment.mass);
    const letters = answerFragments([..."GLK"], aminoAcids).map((fragment) => fragment.mass);
    expect(card).toEqual(letters);
  });

  it("練習問題は、正解の並びなら見えているピークがすべて説明でき、並びを入れ替えると説明しきれない", () => {
    for (const problem of practiceProblems) {
      if (problem.type !== "sequence-builder") continue;
      const peaks = selectPeaks(buildPeptide(problem.sequence, aminoAcids).peaks, problem.shownPeakIds);
      const explained = (codes: readonly string[]) =>
        explainedPeakIds(answerFragments(codes, aminoAcids), peaks).size === peaks.length;

      expect(explained([...problem.correctSequence]), problem.id).toBe(true);

      const reversed = [...problem.correctSequence].reverse();
      const sameReading = reversed.join("") === problem.correctSequence;
      const judged = assessAnswer(problem, { choiceId: null, placed: reversed });
      if (!sameReading && judged.status === "incorrect") {
        expect(explained(reversed), problem.id).toBe(false);
      }
    }
  });
});
