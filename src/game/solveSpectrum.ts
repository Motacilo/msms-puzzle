import { LEFT_CAP, RIGHT_CAP, type AminoAcid } from "./types.ts";

/** 同じ質量はまとめて1つにした、残基質量の一覧。 */
export function distinctResidueMasses(table: readonly AminoAcid[]): number[] {
  return [...new Set(table.map((acid) => acid.residueMass))].sort((a, b) => a - b);
}

/**
 * 左右の印がない質量の集合から、長さ length の残基質量の並びをすべて探す（limit 個で打ち切る）。
 * 見えている質量は、切る前（合計+19）、左のかけら（前から数えた合計+1）、
 * 右のかけら（後ろから数えた合計+19）のどれかとして説明できなければならない。
 * 見えていないピークは制約にしない。
 */
export function solveSpectrum(
  length: number,
  shownMasses: readonly number[],
  alphabet: readonly number[],
  limit = 2,
): number[][] {
  const shown = [...new Set(shownMasses)].sort((a, b) => a - b);
  const results: number[][] = [];
  if (shown.length === 0 || length < 2) return results;

  const lightest = alphabet[0] ?? 0;
  const heaviest = alphabet[alphabet.length - 1] ?? 0;
  const largest = shown[shown.length - 1] ?? 0;

  // 合計 M の候補。見えているどれかが切る前の場合と、どれも切る前でない場合。
  const totals = new Set<number>();
  for (const mass of shown) totals.add(mass - RIGHT_CAP);
  for (let total = largest + 2 * lightest - 76; total <= largest + heaviest; total += 1) {
    totals.add(total);
  }

  for (const total of [...totals].sort((a, b) => a - b)) {
    if (results.length >= limit) break;
    if (total < lightest * length || total > heaviest * length) continue;

    const intactMass = total + RIGHT_CAP;
    // 切る前以外の各ピークは、「ここまでの合計」が次のどちらかであることを要求する。
    const requirements: number[][] = [];
    let feasible = true;
    for (const mass of shown) {
      if (mass === intactMass) continue;
      if (mass > intactMass) {
        feasible = false;
        break;
      }
      const options = [mass - LEFT_CAP, total + RIGHT_CAP - mass].filter(
        (sum) => sum > 0 && sum < total,
      );
      if (options.length === 0) {
        feasible = false;
        break;
      }
      requirements.push(options);
    }
    if (!feasible) continue;

    const sums = new Set<number>();
    const picked: number[] = [];

    const walk = (depth: number, sum: number) => {
      if (results.length >= limit) return;
      if (depth === length) {
        if (sum !== total) return;
        if (requirements.every((options) => options.some((value) => sums.has(value)))) {
          results.push([...picked]);
        }
        return;
      }
      const remaining = length - depth - 1;
      for (const mass of alphabet) {
        const next = sum + mass;
        const rest = total - next;
        if (rest < lightest * remaining || rest > heaviest * remaining) continue;
        const interior = remaining > 0;
        if (interior) sums.add(next);
        picked.push(mass);

        let alive = true;
        if (interior) {
          let open = 0;
          for (const options of requirements) {
            if (options.some((value) => sums.has(value))) continue;
            if (options.every((value) => value <= next)) {
              alive = false;
              break;
            }
            open += 1;
          }
          // 残りの内側の境目の数より、まだ説明できていないピークが多ければ行き詰まり。
          if (alive && open > 2 * (remaining - 1)) alive = false;
        }
        if (alive) walk(depth + 1, next);

        picked.pop();
        if (interior) sums.delete(next);
      }
    };
    walk(0, 0);
  }
  return results;
}
