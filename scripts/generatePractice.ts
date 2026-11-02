/**
 * 練習問題（3〜7残基 × 10問）を作り、src/data/practiceSpecs.ts に書き出す。
 *   node scripts/generatePractice.ts
 * 見えているピークと矛盾しない並びが、長さを決めたうえで1つだけのものだけを採用する。
 * 乱数は固定なので、同じ設定なら同じ問題ができる。問題を変えたいときは SEED を変える。
 */
import { writeFileSync } from "node:fs";
import { aminoAcids } from "../src/data/aminoAcids.ts";
import { buildPeptide } from "../src/game/fragments.ts";
import { distinctResidueMasses, solveSpectrum } from "../src/game/solveSpectrum.ts";

const SEED = 20261102;
const LENGTHS = [3, 4, 5, 6, 7];

type Feature =
  | "full"
  | "repeat"
  | "no-end1"
  | "no-end12"
  | "no-end1-repeat"
  | "gaps"
  | "no-precursor"
  | "ambiguous"
  | "ilkq"
  | "combo1"
  | "combo2";

type Spec = {
  id: string;
  length: number;
  feature: Feature;
  sequence: string;
  shownPeakIds: string[];
};

const alphabet = distinctResidueMasses(aminoAcids);
const massOf = new Map(aminoAcids.map((acid) => [acid.code, acid.residueMass]));
const singleMasses = new Set(alphabet);

/** I と Q は使わない（質量が同じ L と K で書く）。 */
const PLAIN = [..."GASPVTCNDEMHFRYW"];
const WITH_LK = [...PLAIN, "L", "K"];
/** G・A・V・S・D・E は、2つ足すと別の残基の質量になりやすい。 */
const MERGEABLE = [..."GGGAAAVVSSEDGAVS", ...PLAIN];

function planFor(length: number): Feature[] {
  return [
    "full",
    "repeat",
    "no-end1",
    length >= 5 ? "no-end12" : "no-end1-repeat",
    "gaps",
    "no-precursor",
    "ambiguous",
    "ilkq",
    "combo1",
    "combo2",
  ];
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

function hasRepeat(sequence: string): boolean {
  return new Set(sequence).size < sequence.length;
}

function randomSequence(rng: () => number, length: number, letters: readonly string[]): string {
  return Array.from({ length }, () => pick(rng, letters)).join("");
}

function sampleSequence(rng: () => number, length: number, feature: Feature): string | null {
  const sequence = (() => {
    switch (feature) {
      case "ambiguous":
        return randomSequence(rng, length, MERGEABLE);
      case "ilkq": {
        const base = randomSequence(rng, length, PLAIN).split("");
        const count = length >= 5 && rng() < 0.5 ? 2 : 1;
        for (let i = 0; i < count; i += 1) {
          base[Math.floor(rng() * length)] = pick(rng, ["L", "K"]);
        }
        return base.join("");
      }
      case "repeat":
      case "no-end1-repeat":
        return randomSequence(rng, length, PLAIN);
      case "combo2":
        return randomSequence(rng, length, WITH_LK);
      default:
        return randomSequence(rng, length, PLAIN);
    }
  })();

  const repeated = hasRepeat(sequence);
  const hasLk = /[LK]/.test(sequence);
  switch (feature) {
    case "repeat":
    case "no-end1-repeat":
    case "combo2":
      return repeated ? sequence : null;
    case "ilkq":
      return hasLk ? sequence : null;
    case "ambiguous":
      return sequence;
    default:
      return repeated ? null : sequence;
  }
}

function ladderIds(length: number): string[] {
  const ids: string[] = [];
  for (let depth = 1; depth < length; depth += 1) ids.push(`left-${depth}`);
  for (let depth = 1; depth < length; depth += 1) ids.push(`right-${depth}`);
  return ids;
}

function hiddenFor(rng: () => number, length: number, feature: Feature): Set<string> {
  const hidden = new Set<string>();
  const endIds = (depths: number[]) =>
    depths.flatMap((depth) => [`left-${depth}`, `right-${depth}`]);
  const randomGaps = (probability: number) => {
    for (const id of ladderIds(length)) if (rng() < probability) hidden.add(id);
  };
  switch (feature) {
    case "no-end1":
    case "no-end1-repeat":
      endIds([1]).forEach((id) => hidden.add(id));
      break;
    case "no-end12":
      endIds([1, 2]).forEach((id) => hidden.add(id));
      break;
    case "gaps":
      randomGaps(0.35);
      break;
    case "no-precursor":
      hidden.add("intact");
      break;
    case "ambiguous":
      randomGaps(0.4);
      break;
    case "combo1":
      hidden.add("intact");
      if (length === 3) {
        // 3残基では端を両方隠すと2本しか残らないので、片方だけ隠す。
        hidden.add(rng() < 0.5 ? "left-1" : "right-1");
      } else {
        endIds([1]).forEach((id) => hidden.add(id));
      }
      break;
    case "combo2":
      hidden.add("intact");
      randomGaps(0.25);
      break;
    default:
      break;
  }
  return hidden;
}

/** 隣り合う見えているピーク（端の0残基分を含む）の差が、2残基以上なのに1残基の質量になる箇所があるか。 */
function hasMergedGap(length: number, sequence: string, shown: Set<string>): boolean {
  const built = buildPeptide(sequence, aminoAcids);
  const mass = new Map(built.peaks.map((peak) => [peak.id, peak.mass]));
  const intact = mass.get("intact") ?? 0;
  const series = (side: "left" | "right") => {
    const points: { depth: number; mass: number }[] = [
      { depth: 0, mass: side === "left" ? 1 : 19 },
    ];
    for (let depth = 1; depth < length; depth += 1) {
      const id = `${side}-${depth}`;
      if (shown.has(id)) points.push({ depth, mass: mass.get(id) ?? 0 });
    }
    if (shown.has("intact")) {
      points.push({ depth: length, mass: side === "left" ? intact - 18 : intact });
    }
    return points;
  };
  for (const side of ["left", "right"] as const) {
    const points = series(side);
    for (let i = 1; i < points.length; i += 1) {
      const span = points[i]!.depth - points[i - 1]!.depth;
      if (span >= 2 && singleMasses.has(points[i]!.mass - points[i - 1]!.mass)) return true;
    }
  }
  return false;
}

function build(): Spec[] {
  const specs: Spec[] = [];
  for (const length of LENGTHS) {
    const plan = planFor(length);
    const used = new Set<string>();
    plan.forEach((feature, index) => {
      const rng = mulberry32(SEED + length * 1000 + index * 17);
      const id = `p${length}-${String(index + 1).padStart(2, "0")}`;
      for (let attempt = 0; attempt < 60000; attempt += 1) {
        const sequence = sampleSequence(rng, length, feature);
        if (!sequence || used.has(sequence)) continue;
        const built = buildPeptide(sequence, aminoAcids);
        const hidden = hiddenFor(rng, length, feature);
        const shownPeaks = built.peaks.filter((peak) => !hidden.has(peak.id));
        const shown = new Set(shownPeaks.map((peak) => peak.id));

        if (feature === "gaps" && hidden.size < (length === 3 ? 1 : 2)) continue;
        if (feature === "gaps" && shown.size < 3) continue;
        if (feature === "ambiguous" && !hasMergedGap(length, sequence, shown)) continue;
        if (feature === "combo2" && (hidden.size < (length === 3 ? 2 : 3) || shown.size < 3)) continue;
        if (shown.size < 3) continue;

        const solutions = solveSpectrum(
          length,
          shownPeaks.map((peak) => peak.mass),
          alphabet,
          2,
        );
        const truth = [...sequence].map((code) => massOf.get(code)).join(",");
        if (solutions.length !== 1 || solutions[0]!.join(",") !== truth) continue;

        used.add(sequence);
        specs.push({
          id,
          length,
          feature,
          sequence,
          shownPeakIds: shownPeaks.map((peak) => peak.id),
        });
        return;
      }
      throw new Error(`${id} (${feature}) を作れませんでした`);
    });
  }
  return specs;
}

const specs = build();
const lines = specs.map(
  (spec) =>
    `  { id: "${spec.id}", length: ${spec.length}, feature: "${spec.feature}", sequence: "${spec.sequence}", shownPeakIds: ${JSON.stringify(spec.shownPeakIds)} },`,
);
const body = `// scripts/generatePractice.ts が書き出した。手で直さず、スクリプトを直して作り直す。
export type PracticeFeature =
  | "full"
  | "repeat"
  | "no-end1"
  | "no-end12"
  | "no-end1-repeat"
  | "gaps"
  | "no-precursor"
  | "ambiguous"
  | "ilkq"
  | "combo1"
  | "combo2";

export type PracticeSpec = {
  id: string;
  length: number;
  feature: PracticeFeature;
  sequence: string;
  shownPeakIds: readonly string[];
};

export const practiceSpecs: readonly PracticeSpec[] = [
${lines.join("\n")}
];
`;
writeFileSync(new URL("../src/data/practiceSpecs.ts", import.meta.url), body);
for (const spec of specs) {
  console.log(spec.id, spec.feature.padEnd(15), spec.sequence, `${spec.shownPeakIds.length}/${2 * spec.length - 1}`);
}
