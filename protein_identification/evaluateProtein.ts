/** 2026-11-02 にプレイから隔離。アプリ本体はこのフォルダを読み込まない。 */

import { candidateNames, proteinsConsistent } from "./matchProteins.ts";
import type { ProteinMatchProblem } from "./types.ts";

export function assessProtein(
  problem: ProteinMatchProblem,
  selectedIds: readonly string[],
): { status: "incomplete" | "correct" | "incorrect"; message?: string; answer?: string; correct?: string } {
  if (selectedIds.length === 0) {
    return {
      status: "incomplete",
      message: "残る候補を選んでから回答してください。複数残るときは、すべて選んでください。",
    };
  }
  const correctIds = proteinsConsistent(
    problem.candidates,
    problem.peptides,
    problem.resolveCutEnds,
    problem.peptideEnds,
  );
  const same = [...selectedIds].sort().join(",") === [...correctIds].sort().join(",");
  return {
    status: same ? "correct" : "incorrect",
    answer: candidateNames(problem, selectedIds),
    correct: candidateNames(problem, correctIds),
  };
}
