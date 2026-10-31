import { PeptideChain } from "./PeptideChain.tsx";
import { formatPeptide } from "../game/matchProteins.ts";
import type { AminoAcid, ProteinProblem } from "../game/types.ts";

type Props = {
  problem: ProteinProblem;
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
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
