/** 2026-11-02 にプレイから隔離。アプリ本体はこのフォルダを読み込まない。 */

import { candidateNames, formatPeptide, proteinsConsistent } from "./matchProteins.ts";
import type { ProteinMatchProblem, ResidueObservation } from "./types.ts";

export function explainProtein(problem: ProteinMatchProblem): { label: string; equation: string }[] {
  return problem.peptides
    .map((peptide, index) => {
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
              proteinsConsistent([candidate], [peptide], problem.resolveCutEnds, [end]).includes(
                candidate.id,
              ),
            )
            .map((candidate) => candidate.id),
        ),
      };
    })
    .concat({
      label: "残る候補",
      equation: candidateNames(problem, problem.correctCandidateIds),
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
