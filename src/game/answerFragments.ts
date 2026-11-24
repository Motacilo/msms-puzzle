import { canonicalCode } from "./evaluateAnswer.ts";
import { LEFT_CAP, RIGHT_CAP, type AminoAcid, type Peak } from "./types.ts";

/** 回答したペプチドを切ってできる、ひとつのかけら。 */
export type AnswerFragment = {
  id: string;
  side: "left" | "right" | "intact";
  /** 含まれる残基の数。 */
  depth: number;
  mass: number;
  /** 回答の中での範囲。from 以上 to 未満の位置の残基を含む。 */
  from: number;
  to: number;
};

/**
 * 回答の並び（L/I や K/Q のカードは、そのままの表記で入る）から、できるかけらを質量の小さい順に返す。
 * 左のかけら = 含む残基の合計 + 1、右のかけら = 合計 + 19、切る前 = 全残基の合計 + 19。
 * 同じ質量なら、切る前より左、左より右の順に並べ、そのあとで残基の少ないほうを先にする。
 */
export function answerFragments(
  codes: readonly string[],
  table: readonly AminoAcid[],
): AnswerFragment[] {
  const byCode = new Map(table.map((acid) => [acid.code, acid.residueMass]));
  const count = codes.length;
  if (count === 0) return [];

  const prefix = [0];
  for (const code of codes) {
    const mass = byCode.get(canonicalCode(code));
    if (mass === undefined) throw new Error(`未定義の残基です: ${code}`);
    prefix.push((prefix[prefix.length - 1] ?? 0) + mass);
  }
  const total = prefix[count] ?? 0;

  const fragments: AnswerFragment[] = [
    { id: "intact", side: "intact", depth: count, mass: total + RIGHT_CAP, from: 0, to: count },
  ];
  for (let depth = 1; depth < count; depth += 1) {
    fragments.push({
      id: `left-${depth}`,
      side: "left",
      depth,
      mass: (prefix[depth] ?? 0) + LEFT_CAP,
      from: 0,
      to: depth,
    });
    fragments.push({
      id: `right-${depth}`,
      side: "right",
      depth,
      mass: total - (prefix[count - depth] ?? 0) + RIGHT_CAP,
      from: count - depth,
      to: count,
    });
  }

  const order = { left: 0, right: 1, intact: 2 };
  return fragments.sort(
    (a, b) => a.mass - b.mass || order[a.side] - order[b.side] || a.depth - b.depth,
  );
}

/** かけらと質量が一致する、見えているピーク。 */
export function matchingPeaks(fragment: AnswerFragment, peaks: readonly Peak[]): Peak[] {
  return peaks.filter((peak) => peak.mass === fragment.mass);
}

/** いずれかのかけらで説明できた、見えているピークの id。 */
export function explainedPeakIds(
  fragments: readonly AnswerFragment[],
  peaks: readonly Peak[],
): Set<string> {
  const ids = new Set<string>();
  for (const fragment of fragments) {
    for (const peak of matchingPeaks(fragment, peaks)) ids.add(peak.id);
  }
  return ids;
}
