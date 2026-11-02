/** 2026-11-02 にプレイから隔離。アプリ本体はこのフォルダを読み込まない。 */

import { PeptideChain } from "../src/components/PeptideChain.tsx";
import type { AminoAcid } from "../src/game/types.ts";
import { formatPeptide, matchedResidueIndexes } from "./matchProteins.ts";
import type { ProteinMatchProblem } from "./types.ts";

type Props = {
  problem: ProteinMatchProblem;
  acids: readonly AminoAcid[];
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
};

export function ProteinChoices({ problem, acids, selectedIds, onToggle }: Props) {
  return (
    <div>
      <p className="note">読めたペプチド</p>
      <ul className="observed-peptides">
        {problem.peptides.map((peptide, index) => {
          const mass = problem.observedMasses?.[index];
          const label = formatPeptide(peptide);
          return (
            <li key={`${label}-${index}`}>
              {mass === undefined ? label : `${label}（${mass}）`}
            </li>
          );
        })}
      </ul>
      <p className="figure-note">枠で囲んだ残基が、読めたペプチドの位置です。</p>
      <div className="protein-list" role="group" aria-label="残るタンパク質の候補">
        {problem.candidates.map((candidate) => {
          const selected = selectedIds.includes(candidate.id);
          return (
            <button
              key={candidate.id}
              type="button"
              className={selected ? "card protein-option is-selected" : "card protein-option"}
              aria-pressed={selected}
              onClick={() => onToggle(candidate.id)}
            >
              <span className="card-label">{candidate.name}</span>
              <PeptideChain
                acids={acids}
                residues={[...candidate.sequence]}
                hydrogen
                hydroxyl
                observedIndexes={matchedResidueIndexes(
                  candidate.sequence,
                  problem.peptides,
                  problem.resolveCutEnds,
                  problem.peptideEnds,
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
