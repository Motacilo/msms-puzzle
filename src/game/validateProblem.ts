import { assessAnswer } from "./evaluateAnswer.ts";
import { buildPeptide, residueMasses, selectPeaks } from "./fragments.ts";
import { readShownPeaks } from "./readSequence.ts";
import { distinctResidueMasses, solveSpectrum } from "./solveSpectrum.ts";
import {
  CANNOT_BUILD,
  type AminoAcid,
  type ChoiceProblem,
  type Problem,
  type SequenceBuilderProblem,
  type Stage,
  type Briefing,
} from "./types.ts";

export function validateAll(
  problems: readonly Problem[],
  stages: readonly Stage[],
  table: readonly AminoAcid[],
  briefings: readonly Briefing[] = [],
  thorough = true,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const byMass = new Map<number, string[]>();

  for (const acid of table) {
    if (!Number.isFinite(acid.residueMass)) {
      errors.push(`残基質量が数値ではありません: ${acid.code}`);
    }
    const codes = byMass.get(acid.residueMass) ?? [];
    codes.push(acid.code);
    byMass.set(acid.residueMass, codes);
  }
  for (const [mass, codes] of byMass) {
    if (codes.length === 1) continue;
    const key = [...codes].sort().join("");
    const allowed = mass === 113 ? "IL" : mass === 128 ? "KQ" : "";
    if (key !== allowed) {
      errors.push(`残基質量が重複しています: ${mass} (${codes.join(", ")})`);
    }
  }

  for (const problem of problems) {
    if (ids.has(problem.id)) errors.push(`問題IDが重複しています: ${problem.id}`);
    ids.add(problem.id);
    errors.push(...validateProblem(problem, table, thorough));
  }

  const stagedIds = stages.flatMap((stage) => stage.problemIds);
  if (new Set(stagedIds).size !== stagedIds.length) {
    errors.push("ステージ間で問題IDが重複しています");
  }
  for (const id of stagedIds) {
    if (!ids.has(id)) errors.push(`ステージが未知の問題を指しています: ${id}`);
  }
  for (const stage of stages) {
    for (const id of stage.problemIds) {
      const problem = problems.find((item) => item.id === id);
      if (problem && problem.stageId !== stage.id) {
        errors.push(`${id}: ステージIDが ${stage.id} と一致しません`);
      }
    }
  }

  const briefingIds = stages.flatMap((stage) => (stage.briefingId ? [stage.briefingId] : []));
  if (new Set(briefingIds).size !== briefingIds.length) {
    errors.push("説明IDが重複しています");
  }
  const knownBriefings = new Set(briefings.map((briefing) => briefing.id));
  for (const id of briefingIds) {
    if (!knownBriefings.has(id)) errors.push(`ステージが未知の説明を指しています: ${id}`);
    if (ids.has(id)) errors.push(`説明IDが問題IDと重なっています: ${id}`);
  }
  for (const briefing of briefings) {
    if (!briefingIds.includes(briefing.id)) {
      errors.push(`${briefing.id}: どのステージの前にも入っていません`);
    }
    if (briefing.pages.length === 0) {
      errors.push(`${briefing.id}: 説明のページがありません`);
    }
    for (const page of briefing.pages) {
      if (page.text.trim().length === 0) {
        errors.push(`${briefing.id}: 説明の本文がありません`);
      }
    }
  }

  return errors;
}

export function assertPlayable(
  problems: readonly Problem[],
  stages: readonly Stage[],
  table: readonly AminoAcid[],
  briefings: readonly Briefing[] = [],
  thorough = true,
): void {
  const errors = validateAll(problems, stages, table, briefings, thorough);
  if (errors.length > 0) {
    throw new Error(`問題データが規則と合っていません\n${errors.join("\n")}`);
  }
}

function validateProblem(
  problem: Problem,
  table: readonly AminoAcid[],
  thorough: boolean,
): string[] {
  const errors: string[] = [];
  const prefix = problem.id;
  let built;
  try {
    built = buildPeptide(problem.sequence, table);
  } catch (error) {
    const message = error instanceof Error ? error.message : "配列を解釈できません";
    return [`${prefix}: ${message}`];
  }

  for (const peak of built.peaks) {
    if (!Number.isFinite(peak.mass)) errors.push(`${prefix}: ピーク質量が不正です`);
  }

  let shown;
  try {
    shown = selectPeaks(built.peaks, problem.shownPeakIds);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ピークを選べません";
    return [...errors, `${prefix}: ${message}`];
  }

  if (new Set(problem.shownPeakIds).size !== problem.shownPeakIds.length) {
    errors.push(`${prefix}: 表示ピークが重複しています`);
  }
  for (const id of problem.focusPeakIds) {
    if (!problem.shownPeakIds.includes(id)) {
      errors.push(`${prefix}: 強調ピークが表示されていません (${id})`);
    }
  }

  if (problem.type === "choice") {
    errors.push(...validateChoice(problem, table, shown));
  } else if (problem.deduce) {
    errors.push(...validateDeduce(problem, table, shown, thorough));
  } else {
    errors.push(...validateSequence(problem, table, shown));
  }

  return errors;
}

/**
 * 練習問題。左右の印がなく、見えないピークがある。
 * 見えている質量をすべて説明できる配列が、長さを決めたうえで正解の1つだけであることを確かめる。
 * 探索は数十ミリ秒かかるので、起動時の検査では thorough を切る。
 */
function validateDeduce(
  problem: SequenceBuilderProblem,
  table: readonly AminoAcid[],
  shown: ReturnType<typeof selectPeaks>,
  thorough: boolean,
): string[] {
  const errors: string[] = [];
  const prefix = problem.id;
  if (problem.correctSequence !== problem.sequence) {
    errors.push(`${prefix}: 正解配列とペプチド配列が違います`);
  }
  if (!dealCovers(problem.availableAminoAcids, [...problem.correctSequence])) {
    errors.push(`${prefix}: 配るカードに正解の残基が足りません`);
  }
  if (shown.length < 2) errors.push(`${prefix}: 見えているピークが少なすぎます`);
  if (problem.deduce && problem.deduce.features.length === 0) {
    errors.push(`${prefix}: 特徴の名前がありません`);
  }
  if (!thorough) return errors;

  const dealt = table.filter((acid) => problem.availableAminoAcids.includes(acid.code));
  const matches = solveSpectrum(
    problem.correctSequence.length,
    shown.map((peak) => peak.mass),
    distinctResidueMasses(dealt),
    3,
  );
  const truth = residueMasses(problem.correctSequence, table).join(",");
  if (matches.length !== 1 || matches[0]?.join(",") !== truth) {
    errors.push(
      `${prefix}: 見えているピークに合う並びが1つではありません (${matches.map((m) => m.join("-")).join(" / ") || "なし"})`,
    );
  }
  return errors;
}

function validateChoice(
  problem: ChoiceProblem,
  table: readonly AminoAcid[],
  shown: ReturnType<typeof selectPeaks>,
): string[] {
  const errors: string[] = [];
  const prefix = problem.id;
  if (problem.choices.length === 0) errors.push(`${prefix}: 選択肢が空です`);
  const textual =
    problem.question.kind === "complement" ||
    problem.question.kind === "fragment-side" ||
    problem.question.kind === "labeled";

  if (textual) {
    for (const choice of problem.choices) {
      if (!choice.label) errors.push(`${prefix}: 表示用の文がありません (${choice.id})`);
    }
  } else {
    for (const choice of problem.choices) {
      if ([...choice.sequence].some((code) => !table.some((acid) => acid.code === code))) {
        errors.push(`${prefix}: 未定義の残基が選択肢にあります (${choice.sequence})`);
      }
    }
  }

  const sequences = problem.choices.map((choice) => choice.sequence);
  if (new Set(sequences).size !== sequences.length) {
    errors.push(`${prefix}: 選択肢の中身が重複しています`);
  }

  if (problem.question.kind === "composition") {
    errors.push(...validateComposition(problem, table, shown));
    return errors;
  }

  const correct = problem.choices.find((choice) => choice.id === problem.correctChoiceId);
  if (!correct) errors.push(`${prefix}: 正解の選択肢がありません`);
  if (!correct) return errors;
  const judged = assessAnswer(problem, {
    choiceId: problem.correctChoiceId,
    placed: [],
  });
  if (judged.status !== "correct") {
    errors.push(`${prefix}: 正解IDを選んでも正解になりません`);
  }

  if (problem.question.kind === "difference") {
    const [leftId, rightId] = problem.question.peakIds;
    const first = shown.find((peak) => peak.id === leftId);
    const second = shown.find((peak) => peak.id === rightId);
    if (!first || !second) {
      errors.push(`${prefix}: 比べるピークがありません`);
      return errors;
    }
    if (
      first.side === "intact" ||
      first.side !== second.side ||
      Math.abs(first.depth - second.depth) !== 1
    ) {
      errors.push(`${prefix}: 序盤の差は、同じ側で隣り合うかけらに限ります`);
    }
    const diff = Math.abs(first.mass - second.mass);
    const matches = table.filter((acid) => acid.residueMass === diff);
    if (matches.length !== 1 || matches[0]?.code !== correct.sequence) {
      errors.push(`${prefix}: 差 ${diff} が正解の残基と一致しません`);
    }
  } else if (problem.question.kind === "end-residue") {
    const question = problem.question;
    const peak = shown.find((item) => item.id === question.peakId);
    if (!peak || peak.depth !== 1 || peak.side === "intact") {
      errors.push(`${prefix}: 端の残基は、端から1残基分のかけらから読みます`);
      return errors;
    }
    const cap = peak.side === "left" ? 1 : 19;
    const mass = peak.mass - cap;
    const matches = table.filter((acid) => acid.residueMass === mass);
    if (matches.length !== 1 || matches[0]?.code !== correct.sequence) {
      errors.push(`${prefix}: 端の質量 ${mass} が正解の残基と一致しません`);
    }
  } else if (problem.question.kind === "complement") {
    errors.push(...validateComplement(problem, shown));
  } else if (problem.question.kind === "fragment-side") {
    errors.push(...validateFragmentSide(problem, table, shown));
  }

  return errors;
}

function validateComplement(
  problem: ChoiceProblem,
  shown: ReturnType<typeof selectPeaks>,
): string[] {
  const errors: string[] = [];
  const prefix = problem.id;
  if (problem.question.kind !== "complement") return errors;
  const intact = shown.find((peak) => peak.id === "intact");
  if (!intact) {
    errors.push(`${prefix}: 相補の問題には切る前のピークが必要です`);
    return errors;
  }
  const target = intact.mass + 1;
  const hits: string[] = [];
  for (const choice of problem.choices) {
    const parts = choice.id.split("+");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      errors.push(`${prefix}: 選択肢IDはピークIDを + でつないでください (${choice.id})`);
      continue;
    }
    const first = shown.find((peak) => peak.id === parts[0]);
    const second = shown.find((peak) => peak.id === parts[1]);
    if (!first || !second) {
      errors.push(`${prefix}: 選択肢のピークが表示されていません (${choice.id})`);
      continue;
    }
    if (first.mass + second.mass === target) hits.push(choice.id);
  }
  if (hits.length !== 1 || hits[0] !== problem.correctChoiceId) {
    errors.push(
      `${prefix}: 切る前より1大きい組が正解1つではありません (${hits.join(", ") || "なし"})`,
    );
  }
  const [firstId, secondId] = problem.question.peakIds;
  const expected = new Set([`${firstId}+${secondId}`, `${secondId}+${firstId}`]);
  if (!expected.has(problem.correctChoiceId)) {
    errors.push(`${prefix}: 正解IDが問うているピークの組と違います`);
  }
  const first = shown.find((peak) => peak.id === firstId);
  const second = shown.find((peak) => peak.id === secondId);
  if (!first || !second) return errors;
  const left = first.side === "left" ? first : second;
  const right = first.side === "right" ? first : second;
  if (left.side !== "left" || right.side !== "right") {
    errors.push(`${prefix}: 相補な組は左のかけらと右のかけらです`);
  } else if (left.depth + right.depth !== problem.sequence.length) {
    errors.push(`${prefix}: 相補な組の残基数がペプチドの長さと違います`);
  }
  return errors;
}

function validateFragmentSide(
  problem: ChoiceProblem,
  table: readonly AminoAcid[],
  shown: ReturnType<typeof selectPeaks>,
): string[] {
  const errors: string[] = [];
  const prefix = problem.id;
  if (problem.question.kind !== "fragment-side") return errors;
  const question = problem.question;
  const peak = shown.find((item) => item.id === question.peakId);
  if (!peak || peak.depth !== 1 || peak.side !== question.side) {
    errors.push(`${prefix}: 端の判定は、端から1残基分のかけらに限ります`);
    return errors;
  }
  if (problem.correctChoiceId !== question.side) {
    errors.push(`${prefix}: 正解がピークの側と違います`);
  }
  const ids = [...problem.choices.map((choice) => choice.id)].sort();
  if (ids.join(",") !== "left,right") {
    errors.push(`${prefix}: 選択肢は左のかけらと右のかけらです`);
  }
  const cap = question.side === "left" ? 1 : 19;
  const other = question.side === "left" ? 19 : 1;
  const mass = peak.mass - cap;
  const terminal =
    question.side === "left"
      ? problem.sequence[0]
      : problem.sequence[problem.sequence.length - 1];
  const matches = table.filter((acid) => acid.residueMass === mass);
  if (matches.length !== 1 || matches[0]?.code !== terminal) {
    errors.push(`${prefix}: 端の質量 ${mass} が末端の残基と一致しません`);
  }
  if (table.some((acid) => acid.residueMass === peak.mass - other)) {
    errors.push(`${prefix}: 逆の端を引いてもアミノ酸になってしまいます`);
  }
  return errors;
}

function validateComposition(
  problem: ChoiceProblem,
  table: readonly AminoAcid[],
  shown: ReturnType<typeof selectPeaks>,
): string[] {
  const errors: string[] = [];
  const prefix = problem.id;
  if (problem.question.kind !== "composition") return errors;
  const intact = shown.find((peak) => peak.id === "intact");
  if (shown.length !== 1 || !intact || intact.side !== "intact") {
    errors.push(`${prefix}: 組み合わせ問題は切る前のピークだけを出します`);
    return errors;
  }

  for (const choice of problem.choices) {
    if (choice.sequence.length !== 1) {
      errors.push(`${prefix}: 組み合わせ問題のボタンはアミノ酸1つです`);
    }
  }
  const letters = problem.choices.map((choice) => choice.sequence).join("");
  if (!letters.includes("P") || !letters.includes("V")) {
    errors.push(`${prefix}: 選択肢に P と V が必要です`);
  }

  const peptideSum = sumSequence(problem.sequence, table);
  if (peptideSum + 19 !== intact.mass) {
    errors.push(`${prefix}: 切る前が残基合計+19になっていません`);
  }
  const codes = problem.choices.map((choice) => choice.sequence);
  const matched = subsets(codes).filter(
    (subset) => sumSequence(subset.join(""), table) === peptideSum,
  );
  if (
    matched.length !== 1 ||
    !matched[0] ||
    !sameMultiset(matched[0], [...problem.sequence])
  ) {
    errors.push(`${prefix}: 残基合計 ${peptideSum} の組み合わせが一意ではありません`);
  }
  const waterHits = subsets(codes).filter(
    (subset) => sumSequence(subset.join(""), table) + 18 === intact.mass,
  );
  if (waterHits.length > 0) {
    errors.push(`${prefix}: 水を足すとピークになる組み合わせがあります`);
  }
  if (peptideSum + 18 !== intact.mass - 1) {
    errors.push(`${prefix}: 水を足した値はピークより1小さい必要があります`);
  }

  const cannot = assessAnswer(problem, { choiceId: CANNOT_BUILD, placed: [] });
  const picked = assessAnswer(problem, {
    choiceId: null,
    placed: [...problem.sequence],
  });
  if (problem.question.plus === 18) {
    if (problem.correctChoiceId !== CANNOT_BUILD) {
      errors.push(`${prefix}: 水だけでは作れないのが正解です`);
    }
    if (cannot.status !== "correct") {
      errors.push(`${prefix}: 「作れない」が正解になりません`);
    }
    if (picked.status !== "incorrect") {
      errors.push(`${prefix}: 残基を選んでも正解になってしまいます`);
    }
  } else {
    if (picked.status !== "correct") {
      errors.push(`${prefix}: ペプチドのアミノ酸を選んでも正解になりません`);
    }
    if (cannot.status !== "incorrect") {
      errors.push(`${prefix}: 「作れない」が正解になってしまいます`);
    }
  }

  return errors;
}

function subsets(codes: readonly string[]): string[][] {
  const results: string[][] = [];
  const walk = (index: number, acc: string[]) => {
    if (index === codes.length) {
      if (acc.length > 0) results.push(acc);
      return;
    }
    const code = codes[index];
    if (!code) return;
    walk(index + 1, acc);
    walk(index + 1, [...acc, code]);
  };
  walk(0, []);
  return results;
}

function sumSequence(sequence: string, table: readonly AminoAcid[]): number {
  return residueMasses(sequence, table).reduce((sum, mass) => sum + mass, 0);
}

function validateSequence(
  problem: SequenceBuilderProblem,
  table: readonly AminoAcid[],
  shown: ReturnType<typeof selectPeaks>,
): string[] {
  const errors: string[] = [];
  const prefix = problem.id;
  if (problem.correctSequence !== problem.sequence) {
    errors.push(`${prefix}: 正解配列とペプチド配列が違います`);
  }
  if (!dealCovers(problem.availableAminoAcids, [...problem.correctSequence])) {
    errors.push(`${prefix}: 配るカードに正解の残基が足りません`);
  }
  for (const step of problem.guide ?? []) {
    if (!shown.some((peak) => peak.id === step.peakId)) {
      errors.push(`${prefix}: 説明が指すピーク ${step.peakId} が見えていません`);
    }
  }

  const readings = readShownPeaks(problem.sequence.length, shown);
  const expected = [...problem.sequence].map(
    (code) => table.find((acid) => acid.code === code)?.residueMass,
  );
  if (readings.length !== problem.sequence.length) {
    errors.push(`${prefix}: 見えているピークから全残基を読めません`);
  }
  for (const reading of readings) {
    const code = problem.sequence[reading.position];
    const acid = table.find((item) => item.code === code);
    if (expected[reading.position] !== reading.mass || acid?.residueMass !== reading.mass) {
      errors.push(`${prefix}: ${reading.label} の読みが配列と違います`);
    }
  }

  const matches = sequencesOfLength(
    problem.availableAminoAcids,
    problem.correctSequence.length,
  ).filter((candidate) => spectrumMatches(candidate, problem.shownPeakIds, shown, table));
  if (matches.length !== 1 || matches[0] !== problem.correctSequence) {
    errors.push(
      `${prefix}: ピークと一致する配列が1つではありません (${matches.join(", ") || "なし"})`,
    );
  }

  return errors;
}

function spectrumMatches(
  sequence: string,
  shownIds: readonly string[],
  expectedPeaks: readonly { id: string; mass: number }[],
  table: readonly AminoAcid[],
): boolean {
  const built = buildPeptide(sequence, table);
  return shownIds.every((id) => {
    const actual = built.peaks.find((peak) => peak.id === id);
    const expected = expectedPeaks.find((peak) => peak.id === id);
    return actual !== undefined && expected !== undefined && actual.mass === expected.mass;
  });
}

function tally(codes: readonly string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const code of codes) map.set(code, (map.get(code) ?? 0) + 1);
  return map;
}

function sameMultiset(left: string[], right: string[]): boolean {
  const a = tally(left);
  const b = tally(right);
  if (a.size !== b.size) return false;
  for (const [code, count] of a) {
    if (b.get(code) !== count) return false;
  }
  return true;
}

function dealCovers(deal: readonly string[], needed: readonly string[]): boolean {
  const available = new Set(deal);
  return needed.every((code) => available.has(code));
}

/** ボタンは消えないので、同じ残基は長さの範囲で何度でも使える。 */
function sequencesOfLength(codes: readonly string[], length: number): string[] {
  const alphabet = [...new Set(codes)];
  const results: string[] = [];
  const walk = (acc: string[]) => {
    if (acc.length === length) {
      results.push(acc.join(""));
      return;
    }
    for (const code of alphabet) walk([...acc, code]);
  };
  walk([]);
  return results;
}
