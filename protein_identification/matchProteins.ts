/** 2026-11-02 にプレイから隔離。アプリ本体はこのフォルダを読み込まない。 */

import type { ProteinCandidate, ProteinMatchProblem, ResidueObservation } from "./types.ts";

export function formatObservation(token: ResidueObservation): string {
  if (typeof token === "string") return token;
  const [first, second] = [...token].sort();
  return `(${first}/${second})`;
}

export function formatPeptide(peptide: readonly ResidueObservation[]): string {
  return peptide.map((token) => formatObservation(token)).join("");
}

export function proteinsConsistent(
  candidates: readonly ProteinCandidate[],
  peptides: readonly (readonly ResidueObservation[])[],
  resolveCutEnds: boolean,
  ends: readonly ("n" | "c" | undefined)[] = [],
): string[] {
  return candidates
    .filter((candidate) =>
      peptides.every((peptide, index) =>
        containsPeptide(candidate.sequence, applyCut(peptide, resolveCutEnds), ends[index]),
      ),
    )
    .map((candidate) => candidate.id);
}

export function candidateNames(problem: ProteinMatchProblem, ids: readonly string[]): string {
  const names = problem.candidates
    .filter((candidate) => ids.includes(candidate.id))
    .map((candidate) => candidate.name);
  return names.join("、");
}

function applyCut(
  peptide: readonly ResidueObservation[],
  resolveCutEnds: boolean,
): ResidueObservation[] {
  const next = [...peptide];
  if (!resolveCutEnds || next.length === 0) return next;
  const last = next[next.length - 1];
  if (isPair(last, "K", "Q")) next[next.length - 1] = "K";
  return next;
}

function containsPeptide(
  sequence: string,
  peptide: readonly ResidueObservation[],
  end?: "n" | "c",
): boolean {
  return peptideStarts(sequence, peptide, end).length > 0;
}

/** 候補配列のうち、観測したペプチドと重なる残基の位置。 */
export function matchedResidueIndexes(
  sequence: string,
  peptides: readonly (readonly ResidueObservation[])[],
  resolveCutEnds: boolean,
  ends: readonly ("n" | "c" | undefined)[] = [],
): number[] {
  const indexes = new Set<number>();
  peptides.forEach((peptide, peptideIndex) => {
    const tokens = applyCut(peptide, resolveCutEnds);
    for (const start of peptideStarts(sequence, tokens, ends[peptideIndex])) {
      tokens.forEach((_, offset) => indexes.add(start + offset));
    }
  });
  return [...indexes].sort((left, right) => left - right);
}

function peptideStarts(
  sequence: string,
  peptide: readonly ResidueObservation[],
  end?: "n" | "c",
): number[] {
  if (peptide.length === 0 || peptide.length > sequence.length) return [];
  const lastStart = sequence.length - peptide.length;
  const startAt = end === "c" ? lastStart : 0;
  const endAt = end === "n" || end === "c" ? startAt : lastStart;
  const starts: number[] = [];
  for (let start = startAt; start <= endAt; start += 1) {
    const matched = peptide.every((token, index) => {
      const residue = sequence[start + index];
      if (!residue) return false;
      if (typeof token === "string") return token === residue;
      return token.includes(residue);
    });
    if (matched) starts.push(start);
  }
  return starts;
}

function isPair(token: ResidueObservation, left: string, right: string): boolean {
  return Array.isArray(token) && token.includes(left) && token.includes(right);
}
