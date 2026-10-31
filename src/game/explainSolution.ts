import { buildPeptide, residueMasses, selectPeaks } from "./fragments.ts";
import { residueLabel } from "./labels.ts";
import { candidateNames, formatPeptide, proteinsConsistent } from "./matchProteins.ts";
import { readShownPeaks } from "./readSequence.ts";
import type { AminoAcid, Problem, ResidueObservation } from "./types.ts";

export type ExplanationStep = {
  label: string;
  equation: string;
};

export function explainSolution(
  problem: Problem,
  table: readonly AminoAcid[],
): ExplanationStep[] {
  const built = buildPeptide(problem.sequence, table);
  const shown = selectPeaks(built.peaks, problem.shownPeakIds);

  if (problem.type === "choice" && problem.question.kind === "difference") {
    const [firstId, secondId] = problem.question.peakIds;
    const first = shown.find((peak) => peak.id === firstId);
    const second = shown.find((peak) => peak.id === secondId);
    if (!first || !second) return [];
    const larger = Math.max(first.mass, second.mass);
    const smaller = Math.min(first.mass, second.mass);
    const diff = larger - smaller;
    return [
      {
        label: "かけらが1残基伸びた分",
        equation: withResidue(`${larger} − ${smaller} = ${diff}`, diff, table),
      },
    ];
  }

  if (problem.type === "choice" && problem.question.kind === "composition") {
    const masses = residueMasses(problem.sequence, table);
    const sum = masses.reduce((total, mass) => total + mass, 0);
    const terms = [...problem.sequence]
      .map((code, index) => `${code} ${masses[index] ?? ""}`)
      .join(" + ");
    const water = sum + 18;
    const intact = shown.find((peak) => peak.id === "intact")?.mass;
    const steps: ExplanationStep[] = [
      { label: "残基の合計", equation: `${terms} = ${sum}` },
      { label: "水の18を足す", equation: `${sum} + 18 = ${water}` },
    ];
    if (problem.question.plus === 18) {
      steps.push({
        label: "ピークとの差",
        equation: `${intact ?? "?"} − ${water} = ${(intact ?? water) - water}`,
      });
    } else {
      steps.push({
        label: "電荷の1を足す",
        equation: `${water} + 1 = ${water + 1}`,
      });
    }
    return steps;
  }

  if (problem.type === "choice" && problem.question.kind === "complement") {
    const [firstId, secondId] = problem.question.peakIds;
    const first = shown.find((peak) => peak.id === firstId);
    const second = shown.find((peak) => peak.id === secondId);
    const intact = shown.find((peak) => peak.id === "intact");
    if (!first || !second || !intact) return [];
    return [
      {
        label: "相補な組",
        equation: `${first.mass} + ${second.mass} = ${first.mass + second.mass}`,
      },
      {
        label: "切る前より1大きい",
        equation: `${intact.mass} + 1 = ${intact.mass + 1}`,
      },
    ];
  }

  if (problem.type === "choice" && problem.question.kind === "fragment-side") {
    const question = problem.question;
    const peak = shown.find((item) => item.id === question.peakId);
    if (!peak || peak.side === "intact") return [];
    return [
      {
        label: "端の1を引く",
        equation: describeCap(peak.mass, 1, table),
      },
      {
        label: "端の19を引く",
        equation: describeCap(peak.mass, 19, table),
      },
    ];
  }

  if (problem.type === "choice" && problem.question.kind === "end-residue") {
    const question = problem.question;
    const peak = shown.find((item) => item.id === question.peakId);
    if (!peak || peak.side === "intact") return [];
    const cap = peak.side === "left" ? 1 : 19;
    const mass = peak.mass - cap;
    return [
      {
        label: peak.side === "left" ? "左端" : "右端",
        equation: withResidue(`${peak.mass} − ${cap} = ${mass}`, mass, table),
      },
    ];
  }

  if (problem.type === "protein") {
    return problem.peptides.map((peptide, index) => {
      const end = problem.peptideEnds?.[index];
      const mass = problem.observedMasses?.[index];
      const where = end === "n" ? "、N末端" : end === "c" ? "、C末端" : "";
      const name = formatPeptide(shownPeptide(peptide, problem.resolveCutEnds));
      return {
        label: mass === undefined ? name : `${name}（${mass}${where}）`,
        equation: candidateNames(
          problem,
          problem.candidates
            .filter((candidate) =>
              proteinsConsistent(
                [candidate],
                [peptide],
                problem.resolveCutEnds,
                [end],
              ).includes(candidate.id),
            )
            .map((candidate) => candidate.id),
        ),
      };
    }).concat({
      label: "残る候補",
      equation: candidateNames(problem, problem.correctCandidateIds),
    });
  }

  if (problem.type !== "sequence-builder") return [];
  return readShownPeaks(problem.sequence.length, shown).map((reading) => {
    const code = problem.sequence[reading.position] ?? "";
    return {
      label: reading.label,
      equation: withCode(reading.equation, code, table),
    };
  });
}

function shownPeptide(
  peptide: readonly ResidueObservation[],
  resolveCutEnds: boolean,
): ResidueObservation[] {
  if (!resolveCutEnds || peptide.length === 0) return [...peptide];
  const next = [...peptide];
  const last = next[next.length - 1];
  if (Array.isArray(last) && last.includes("K") && last.includes("Q")) {
    next[next.length - 1] = "K";
  }
  return next;
}

function withCode(
  equation: string,
  code: string,
  table: readonly AminoAcid[],
): string {
  if (!code) return equation;
  return `${equation} → ${residueLabel(code, table)}`;
}

function withResidue(
  equation: string,
  mass: number,
  table: readonly AminoAcid[],
): string {
  const name = namesForMass(mass, table);
  if (!name) return equation;
  return `${equation} → ${name}`;
}

function describeCap(peakMass: number, cap: number, table: readonly AminoAcid[]): string {
  const mass = peakMass - cap;
  const equation = `${peakMass} − ${cap} = ${mass}`;
  const name = namesForMass(mass, table);
  if (!name) return `${equation}（アミノ酸にならない）`;
  return `${equation} → ${name}`;
}

function namesForMass(mass: number, table: readonly AminoAcid[]): string | null {
  const acids = table.filter((acid) => acid.residueMass === mass);
  if (acids.length === 0) return null;
  return acids.map((acid) => residueLabel(acid.code, table)).join(" または ");
}
