/** 2026-11-02 にプレイから隔離。アプリ本体はこのフォルダを読み込まない。 */

import type { AminoAcid } from "../src/game/types.ts";
import { proteinsConsistent } from "./matchProteins.ts";
import type { ProteinMatchProblem, ResidueObservation } from "./types.ts";

const LEFT_CAP = 1;
const RIGHT_CAP = 19;

export function validateProtein(problem: ProteinMatchProblem, table: readonly AminoAcid[]): string[] {
  const errors: string[] = [];
  const prefix = problem.id;
  if (problem.candidates.length < 2) {
    errors.push(`${prefix}: 候補は2つ以上必要です`);
  }
  if (problem.peptides.length === 0) {
    errors.push(`${prefix}: 観測ペプチドがありません`);
  }
  const ids = problem.candidates.map((candidate) => candidate.id);
  if (new Set(ids).size !== ids.length) {
    errors.push(`${prefix}: 候補IDが重複しています`);
  }
  for (const candidate of problem.candidates) {
    errors.push(...unknownCodes(prefix, candidate.sequence, table));
  }
  for (const peptide of problem.peptides) {
    if (peptide.length === 0) errors.push(`${prefix}: 空のペプチドがあります`);
    for (const token of peptide) {
      if (typeof token === "string") {
        errors.push(...unknownCodes(prefix, token, table));
      } else {
        const key = [...token].sort().join("");
        if (key !== "IL" && key !== "KQ") {
          errors.push(`${prefix}: 質量が同じ組は I/L と K/Q だけです (${key})`);
        }
      }
    }
  }
  if (problem.peptideEnds && problem.peptideEnds.length > problem.peptides.length) {
    errors.push(`${prefix}: 端の指定がペプチドより多いです`);
  }
  if (problem.observedMasses) {
    if (problem.observedMasses.length !== problem.peptides.length) {
      errors.push(`${prefix}: 表示質量の数がペプチドと違います`);
    } else {
      problem.peptides.forEach((peptide, index) => {
        const sum = observedResidueSum(peptide, table);
        const end = problem.peptideEnds?.[index];
        const cap = end === "n" ? LEFT_CAP : RIGHT_CAP;
        const mass = problem.observedMasses?.[index];
        if (sum === null || mass !== sum + cap) {
          errors.push(`${prefix}: 表示質量が残基と合いません (${String(mass)})`);
        }
      });
    }
  }
  const matched = proteinsConsistent(
    problem.candidates,
    problem.peptides,
    problem.resolveCutEnds,
    problem.peptideEnds,
  );
  const correct = [...problem.correctCandidateIds].sort().join(",");
  if ([...matched].sort().join(",") !== correct) {
    errors.push(`${prefix}: 残る候補が正解と違います (規則: ${matched.join(", ") || "なし"})`);
  }
  return errors;
}

function observedResidueSum(
  peptide: readonly ResidueObservation[],
  table: readonly AminoAcid[],
): number | null {
  let sum = 0;
  for (const token of peptide) {
    const codes = typeof token === "string" ? [token] : [...token];
    const masses = codes.map((code) => table.find((acid) => acid.code === code)?.residueMass);
    if (masses.some((mass) => mass === undefined)) return null;
    if (new Set(masses).size !== 1) return null;
    const mass = masses[0];
    if (mass === undefined) return null;
    sum += mass;
  }
  return sum;
}

function unknownCodes(prefix: string, sequence: string, table: readonly AminoAcid[]): string[] {
  return [...sequence]
    .filter((code) => !table.some((acid) => acid.code === code))
    .map((code) => `${prefix}: 未定義の残基です (${code})`);
}
