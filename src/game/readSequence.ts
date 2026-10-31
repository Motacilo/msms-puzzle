import { LEFT_CAP, RIGHT_CAP, type Peak } from "./types.ts";

export type Reading = {
  position: number;
  mass: number;
  label: string;
  equation: string;
};

/**
 * 見えているピークだけから、各位置の残基質量を読む。
 * 左の列を優先し、空いた位置を右の列で埋め、1つだけ残れば切る前から逆算する。
 */
export function readShownPeaks(
  length: number,
  peaks: readonly Peak[],
): Reading[] {
  const left = new Map<number, number>();
  const right = new Map<number, number>();
  let intact: number | null = null;
  for (const peak of peaks) {
    if (peak.side === "left") left.set(peak.depth, peak.mass);
    else if (peak.side === "right") right.set(peak.depth, peak.mass);
    else intact = peak.mass;
  }

  const found = new Map<number, Reading>();
  const place = (
    position: number,
    mass: number,
    label: string,
    equation: string,
  ) => {
    if (position < 0 || position >= length || found.has(position)) return;
    found.set(position, { position, mass, label, equation });
  };

  if (left.has(1)) {
    const mass = left.get(1)!;
    place(
      0,
      mass - LEFT_CAP,
      "左端",
      `${mass} − ${LEFT_CAP} = ${mass - LEFT_CAP}`,
    );
  }

  for (const depth of [...left.keys()].sort((a, b) => a - b)) {
    if (depth < 2 || !left.has(depth - 1)) continue;
    const larger = left.get(depth)!;
    const smaller = left.get(depth - 1)!;
    const mass = larger - smaller;
    place(
      depth - 1,
      mass,
      `左から${depth}番目`,
      `${larger} − ${smaller} = ${mass}`,
    );
  }

  if (right.has(1)) {
    const mass = right.get(1)!;
    place(
      length - 1,
      mass - RIGHT_CAP,
      "右端",
      `${mass} − ${RIGHT_CAP} = ${mass - RIGHT_CAP}`,
    );
  }

  for (const depth of [...right.keys()].sort((a, b) => a - b)) {
    if (depth < 2 || !right.has(depth - 1)) continue;
    const larger = right.get(depth)!;
    const smaller = right.get(depth - 1)!;
    const mass = larger - smaller;
    place(
      length - depth,
      mass,
      `右から${depth}番目`,
      `${larger} − ${smaller} = ${mass}`,
    );
  }

  if (intact !== null && right.has(length - 1)) {
    const capFragment = right.get(length - 1)!;
    const mass = intact - capFragment;
    place(0, mass, "左端", `${intact} − ${capFragment} = ${mass}`);
  }

  if (intact !== null) {
    const missing = [...Array(length).keys()].filter((index) => !found.has(index));
    if (missing.length === 1) {
      const total = intact - RIGHT_CAP;
      const known = [...found.values()].reduce(
        (sum, reading) => sum + reading.mass,
        0,
      );
      const mass = total - known;
      const position = missing[0];
      place(
        position,
        mass,
        position === length - 1 ? "右端" : `左から${position + 1}番目`,
        `残基の合計 ${total} − 分かっている残基 ${known} = ${mass}`,
      );
    }
  }

  return [...found.values()].sort((a, b) => a.position - b.position);
}
