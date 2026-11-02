/** 2026-11-02 にプレイから隔離。アプリ本体はこのフォルダを読み込まない。 */

import { PeptideChain } from "../src/components/PeptideChain.tsx";
import type { AminoAcid } from "../src/game/types.ts";
import { matchedResidueIndexes } from "./matchProteins.ts";
import { sampleCandidates, sampleView } from "./sample.ts";

type Props = {
  acids: readonly AminoAcid[];
  clearedProblemIds: readonly string[];
  compact?: boolean;
};

export function SampleFrame({ acids, clearedProblemIds, compact = false }: Props) {
  const view = sampleView(clearedProblemIds);
  return (
    <aside className={compact ? "sample-frame is-compact" : "sample-frame"}>
      <p className="eyebrow">サンプル</p>
      <p className="sample-status">{view.statusLine}</p>
      {compact ? (
        <p className="sample-names">
          {sampleCandidates.map((candidate) => `${candidate.name} ${candidate.sequence}`).join("、")}
        </p>
      ) : (
        <div className="sample-candidates">
          {view.peptides.length > 0 ? (
            <p className="figure-note">枠で囲んだ残基が、読めたペプチドです。</p>
          ) : null}
          {sampleCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className={
                view.identifiedId === candidate.id
                  ? "sample-candidate is-result"
                  : "sample-candidate"
              }
            >
              <span className="card-label">{candidate.name}</span>
              <PeptideChain
                acids={acids}
                residues={[...candidate.sequence]}
                hydrogen
                hydroxyl
                observedIndexes={matchedResidueIndexes(
                  candidate.sequence,
                  view.peptides,
                  false,
                  view.ends,
                )}
              />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
