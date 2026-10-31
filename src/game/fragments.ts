import {
  LEFT_CAP,
  RIGHT_CAP,
  type AminoAcid,
  type BuiltPeptide,
  type Peak,
} from "./types.ts";

/**
 * 左のかけら（bイオン）= 含む残基の合計 + 1
 * 右のかけら（yイオン）= 含む残基の合計 + 19
 * 切る前 = 全残基の合計 + 19
 * 全長のかけらは作らず、端から 1 残基分〜残基数-1 までを作る。
 */
export function residueMasses(
  sequence: string,
  table: readonly AminoAcid[],
): number[] {
  const byCode = new Map(table.map((acid) => [acid.code, acid.residueMass]));
  return [...sequence].map((code) => {
    const mass = byCode.get(code);
    if (mass === undefined) {
      throw new Error(`未定義の残基です: ${code}`);
    }
    return mass;
  });
}

export function buildPeptide(
  sequence: string,
  table: readonly AminoAcid[],
): BuiltPeptide {
  const masses = residueMasses(sequence, table);
  const residueSum = masses.reduce((sum, mass) => sum + mass, 0);
  const intactMass = residueSum + RIGHT_CAP;
  const peaks: Peak[] = [
    peak("intact", intactMass, "intact", masses.length, "切る前", sequence),
  ];

  let prefix = 0;
  for (let depth = 1; depth < masses.length; depth += 1) {
    prefix += masses[depth - 1];
    peaks.push(
      peak(
        `left-${depth}`,
        prefix + LEFT_CAP,
        "left",
        depth,
        `左端から${depth}残基分`,
        sequence,
      ),
    );
  }

  let suffix = 0;
  for (let depth = 1; depth < masses.length; depth += 1) {
    suffix += masses[masses.length - depth];
    peaks.push(
      peak(
        `right-${depth}`,
        suffix + RIGHT_CAP,
        "right",
        depth,
        `右端から${depth}残基分`,
        sequence,
      ),
    );
  }

  return {
    sequence,
    residueMasses: masses,
    residueSum,
    intactMass,
    peaks,
  };
}

export function peaksById(peaks: readonly Peak[]): Map<string, Peak> {
  return new Map(peaks.map((peak) => [peak.id, peak]));
}

/** 全長のN末端側など、通常のピーク列に無い質量をそのまま出す。 */
export function peaksFromMasses(masses: readonly number[]): Peak[] {
  return masses.map((mass, index) =>
    peak(`observed-${index}`, mass, "intact", index, "", `observed:${mass}`),
  );
}

export function selectPeaks(
  peaks: readonly Peak[],
  ids: readonly string[],
): Peak[] {
  const byId = peaksById(peaks);
  const selected: Peak[] = [];
  for (const id of ids) {
    const peak = byId.get(id);
    if (!peak) {
      throw new Error(`ピークがありません: ${id}`);
    }
    selected.push(peak);
  }
  return selected.sort(comparePeaks);
}

function peak(
  id: string,
  mass: number,
  side: Peak["side"],
  depth: number,
  label: string,
  sequence: string,
): Peak {
  return {
    id,
    mass,
    side,
    depth,
    label,
    intensity: intensityFor(`${sequence}:${id}`),
  };
}

/** 同じピークならいつも同じ高さになる疑似乱数。判定には使わない。 */
export function intensityFor(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const unit = (hash >>> 0) / 4294967295;
  return 0.38 + unit * 0.62;
}

function comparePeaks(a: Peak, b: Peak): number {
  const sideOrder = { intact: 0, left: 1, right: 2 };
  const sideDiff = sideOrder[a.side] - sideOrder[b.side];
  if (sideDiff !== 0) return sideDiff;
  return a.depth - b.depth;
}
