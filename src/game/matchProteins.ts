import type {
  ProteinCandidate,
  ProteinProblem,
  ResidueObservation,
} from "./types.ts";

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
        containsPeptide(
          candidate.sequence,
          applyCut(peptide, resolveCutEnds),
          ends[index],
        ),
      ),
    )
    .map((candidate) => candidate.id);
}

export function candidateNames(
  problem: ProteinProblem,
  ids: readonly string[],
): string {
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
  if (peptide.length === 0 || peptide.length > sequence.length) return false;
  const lastStart = sequence.length - peptide.length;
  const startAt = end === "c" ? lastStart : 0;
  const endAt = end === "n" || end === "c" ? startAt : lastStart;
  for (let start = startAt; start <= endAt; start += 1) {
    const matched = peptide.every((token, index) => {
      const residue = sequence[start + index];
      if (!residue) return false;
      if (typeof token === "string") return token === residue;
      return token.includes(residue);
    });
    if (matched) return true;
  }
  return false;
}

function isPair(token: ResidueObservation, left: string, right: string): boolean {
  return Array.isArray(token) && token.includes(left) && token.includes(right);
}
