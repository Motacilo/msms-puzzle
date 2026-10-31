import { useState } from "react";
import { ChoiceList } from "../components/ChoiceList.tsx";
import { FragmentMemoDialog } from "../components/FragmentMemoDialog.tsx";
import { PeakSpectrum } from "../components/PeakSpectrum.tsx";
import { ProteinChoices } from "../components/ProteinChoices.tsx";
import { SequenceBuilder } from "../components/SequenceBuilder.tsx";
import { buildPeptide, peaksFromMasses, selectPeaks } from "../game/fragments.ts";
import { fragmentLabel } from "../game/labels.ts";
import {
  CANNOT_BUILD,
  type AminoAcid,
  type AnswerDraft,
  type Problem,
} from "../game/types.ts";

type Props = {
  stageTitle: string;
  indexLabel: string;
  problem: Problem;
  acids: readonly AminoAcid[];
  draft: AnswerDraft;
  notice: string | null;
  onDraft: (draft: AnswerDraft) => void;
  onSubmit: () => void;
  onHome: () => void;
};

export function AnalysisScreen({
  stageTitle,
  indexLabel,
  problem,
  acids,
  draft,
  notice,
  onDraft,
  onSubmit,
  onHome,
}: Props) {
  const [memoPeakId, setMemoPeakId] = useState<string | null>(null);
  const shown =
    problem.type === "protein" && problem.observedMasses
      ? peaksFromMasses(problem.observedMasses)
      : selectPeaks(buildPeptide(problem.sequence, acids).peaks, problem.shownPeakIds);
  const multiple = problem.type === "choice" && problem.question.kind === "composition";
  const memos = draft.memos ?? {};
  const notes = Object.fromEntries(
    Object.entries(memos).flatMap(([id, memo]) => {
      const label = fragmentLabel(memo);
      return label ? [[id, label] as const] : [];
    }),
  );
  const memoPeak = shown.find((peak) => peak.id === memoPeakId) ?? null;

  return (
    <main className="app">
      <div className="play-top">
        <button type="button" className="text-button" onClick={onHome}>
          ホーム
        </button>
        <p className="eyebrow">
          {stageTitle} · {indexLabel}
        </p>
      </div>
      <h1>{problem.title}</h1>
      <div className="play-layout">
        <section>
          <p className="instruction">{problem.instruction}</p>
          <PeakSpectrum peaks={shown} notes={notes} onSelect={setMemoPeakId} />
        </section>
        <section className="answer-panel">
          {problem.hint ? (
            <div className="answer-tools">
              <details className="hint">
                <summary>ヒント</summary>
                <p>{problem.hint}</p>
              </details>
            </div>
          ) : null}
          {problem.type === "choice" && multiple ? (
            <ChoiceList
              multiple
              acids={acids}
              choices={problem.choices}
              selectedCodes={draft.placed}
              impossible={draft.choiceId === CANNOT_BUILD}
              onToggle={(code) => {
                const placed = draft.placed.includes(code)
                  ? draft.placed.filter((item) => item !== code)
                  : [...draft.placed, code];
                onDraft({ ...draft, choiceId: null, placed });
              }}
              onImpossible={() =>
                onDraft({
                  ...draft,
                  choiceId: draft.choiceId === CANNOT_BUILD ? null : CANNOT_BUILD,
                  placed: [],
                })
              }
            />
          ) : problem.type === "choice" ? (
            <ChoiceList
              acids={acids}
              choices={problem.choices}
              selectedId={draft.choiceId}
              onSelect={(choiceId) => onDraft({ ...draft, choiceId })}
            />
          ) : problem.type === "protein" ? (
            <ProteinChoices
              problem={problem}
              acids={acids}
              selectedIds={draft.selectedIds ?? []}
              onToggle={(id) => {
                const current = draft.selectedIds ?? [];
                const selectedIds = current.includes(id)
                  ? current.filter((item) => item !== id)
                  : [...current, id];
                onDraft({ ...draft, selectedIds });
              }}
            />
          ) : (
            <SequenceBuilder
              key={problem.id}
              acids={acids}
              length={problem.correctSequence.length}
              deal={problem.availableAminoAcids}
              placed={draft.placed}
              onChange={(placed) => onDraft({ ...draft, placed })}
            />
          )}
          {notice ? (
            <p className="notice" role="status">
              {notice}
            </p>
          ) : null}
          <button type="button" className="primary" onClick={onSubmit}>
            回答する
          </button>
        </section>
      </div>
      {memoPeak ? (
        <FragmentMemoDialog
          peak={memoPeak}
          acids={acids}
          palette={memoPalette(problem)}
          initial={memos[memoPeak.id] ?? { residues: [], hydrogen: false, hydroxyl: false }}
          onSave={(memo) => {
            onDraft({ ...draft, memos: { ...memos, [memoPeak.id]: memo } });
            setMemoPeakId(null);
          }}
          onClear={() => {
            const next = { ...memos };
            delete next[memoPeak.id];
            onDraft({ ...draft, memos: next });
            setMemoPeakId(null);
          }}
          onClose={() => setMemoPeakId(null)}
        />
      ) : null}
    </main>
  );
}

function memoPalette(problem: Problem): string[] {
  if (problem.type === "protein") {
    const codes = new Set<string>();
    for (const candidate of problem.candidates) {
      for (const code of candidate.sequence) codes.add(code);
    }
    for (const peptide of problem.peptides) {
      for (const token of peptide) {
        if (typeof token === "string") codes.add(token);
        else for (const code of token) codes.add(code);
      }
    }
    return [...codes];
  }
  if (problem.type === "sequence-builder") return [...problem.availableAminoAcids];
  const codes = problem.choices
    .map((choice) => choice.sequence)
    .filter((code) => /^[A-Z]$/.test(code));
  if (codes.length > 0) return codes;
  return [...new Set(problem.sequence)];
}
