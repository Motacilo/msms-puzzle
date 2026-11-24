import { useState } from "react";
import { Calculator } from "../components/Calculator.tsx";
import { FreeNoteDialog } from "../components/FreeNoteDialog.tsx";
import { Modal } from "../components/Modal.tsx";
import { ChoiceList } from "../components/ChoiceList.tsx";
import { FragmentMemoDialog } from "../components/FragmentMemoDialog.tsx";
import { PeakSpectrum, type RangeNote } from "../components/PeakSpectrum.tsx";
import { SequenceBuilder } from "../components/SequenceBuilder.tsx";
import type { CalcMode, Token } from "../game/calculator.ts";
import { buildPeptide, selectPeaks } from "../game/fragments.ts";
import {
  CANNOT_BUILD,
  type AminoAcid,
  type AnswerDraft,
  type FragmentMemo,
  type GuideStep,
  type Peak,
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
  // ピークの1回目のタップで選択（赤）、同じピークをもう1回でそのピークのメモ、別のピークで間のメモ。
  const [selectedPeakId, setSelectedPeakId] = useState<string | null>(null);
  const [memoTarget, setMemoTarget] = useState<
    { kind: "peak"; id: string } | { kind: "range"; fromId: string; toId: string } | null
  >(null);
  const [guideIndex, setGuideIndex] = useState(0);
  const [guideOpen, setGuideOpen] = useState(true);
  // 電卓は、モードを変えても式が残るように、式をここで持つ。
  const [calcOpen, setCalcOpen] = useState(false);
  const [freeNoteOpen, setFreeNoteOpen] = useState(false);
  const [calcMode, setCalcMode] = useState<CalcMode>("normal");
  const [calcTokens, setCalcTokens] = useState<Token[]>([]);
  const shown = selectPeaks(buildPeptide(problem.sequence, acids).peaks, problem.shownPeakIds);
  const multiple = problem.type === "choice" && problem.question.kind === "composition";
  const memos = draft.memos ?? {};
  const rangeMemos = draft.rangeMemos ?? {};
  const peakColors = draft.peakColors ?? {};
  const notes: Record<string, readonly FragmentMemo[]> = Object.fromEntries(
    Object.entries(memos).filter(([, list]) => list.length > 0),
  );
  const rangeNotes: RangeNote[] = Object.entries(rangeMemos).flatMap(([key, list]) => {
    const [fromId = "", toId = ""] = key.split("|");
    if (list.length === 0 || !shown.some((p) => p.id === fromId) || !shown.some((p) => p.id === toId)) return [];
    return [{ key, fromId, toId, memos: list }];
  });
  const freeNote = draft.freeNote ?? "";
  const peakById = (id: string): Peak | undefined => shown.find((peak) => peak.id === id);

  function tapPeak(id: string) {
    if (selectedPeakId === null) {
      setSelectedPeakId(id);
      return;
    }
    if (selectedPeakId === id) {
      setSelectedPeakId(null);
      setMemoTarget({ kind: "peak", id });
      return;
    }
    setSelectedPeakId(null);
    openRange(selectedPeakId, id);
  }

  function openRange(firstId: string, secondId: string) {
    const first = peakById(firstId);
    const second = peakById(secondId);
    if (!first || !second) return;
    const [fromId, toId] =
      first.mass < second.mass || (first.mass === second.mass && firstId < secondId)
        ? [firstId, secondId]
        : [secondId, firstId];
    setMemoTarget({ kind: "range", fromId, toId });
  }

  const guide = problem.type === "sequence-builder" ? problem.guide : undefined;
  const guideStep = guide?.[guideIndex] ?? guide?.[0];
  const showingGuide = Boolean(guide && guideOpen && guideStep);

  return (
    <main className={showingGuide ? "app is-spotlight" : "app"}>
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
          {showingGuide && guide ? (
            <GuideRead
              steps={guide}
              index={Math.min(guideIndex, guide.length - 1)}
              onIndex={setGuideIndex}
              onClose={() => setGuideOpen(false)}
            />
          ) : guide ? (
            <button type="button" className="text-button guide-reopen" onClick={() => setGuideOpen(true)}>
              説明を開く
            </button>
          ) : null}
          <PeakSpectrum
            peaks={shown}
            notes={notes}
            rangeNotes={rangeNotes}
            peakColors={peakColors}
            selectedPeakId={selectedPeakId}
            guidePeakId={showingGuide ? guideStep?.peakId : undefined}
            onSelect={tapPeak}
            onSelectRange={openRange}
            onBlankClick={() => setSelectedPeakId(null)}
          />
        </section>
        <section className="answer-panel">
          <div className="answer-tools">
            {problem.hint && !guide ? (
              <details className="hint">
                <summary>ヒント</summary>
                <p>{problem.hint}</p>
              </details>
            ) : null}
            <button
              type="button"
              className="secondary calc-toggle"
              aria-haspopup="dialog"
              onClick={() => setCalcOpen(true)}
            >
              電卓
            </button>
            <button
              type="button"
              className={freeNote ? "secondary calc-toggle has-note" : "secondary calc-toggle"}
              aria-haspopup="dialog"
              onClick={() => setFreeNoteOpen(true)}
            >
              自由メモ{freeNote ? "（あり）" : ""}
            </button>
          </div>
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
      {memoTarget?.kind === "peak" ? (
        <FragmentMemoDialog
          scope="peak"
          title={`質量 ${peakById(memoTarget.id)?.mass ?? ""} のメモ`}
          acids={acids}
          palette={memoPalette(problem)}
          memos={memos[memoTarget.id] ?? []}
          onChange={(list) => {
            const next = { ...memos };
            if (list.length === 0) delete next[memoTarget.id];
            else next[memoTarget.id] = list;
            onDraft({ ...draft, memos: next });
          }}
          color={peakColors[memoTarget.id] ?? "black"}
          onColor={(color) => {
            const next = { ...peakColors };
            if (color === "black") delete next[memoTarget.id];
            else next[memoTarget.id] = color;
            onDraft({ ...draft, peakColors: next });
          }}
          onClose={() => setMemoTarget(null)}
        />
      ) : null}
      {memoTarget?.kind === "range" ? (
        <FragmentMemoDialog
          scope="range"
          title={`質量 ${peakById(memoTarget.fromId)?.mass ?? ""} と ${peakById(memoTarget.toId)?.mass ?? ""} の間のメモ`}
          acids={acids}
          palette={memoPalette(problem)}
          memos={rangeMemos[`${memoTarget.fromId}|${memoTarget.toId}`] ?? []}
          onChange={(list) => {
            const key = `${memoTarget.fromId}|${memoTarget.toId}`;
            const next = { ...rangeMemos };
            if (list.length === 0) delete next[key];
            else next[key] = list;
            onDraft({ ...draft, rangeMemos: next });
          }}
          onClose={() => setMemoTarget(null)}
        />
      ) : null}
      {calcOpen ? (
        <Modal title="電卓" titleId="calculator-title" compact onClose={() => setCalcOpen(false)}>
          <Calculator
            acids={acids}
            mode={calcMode}
            tokens={calcTokens}
            onMode={setCalcMode}
            onTokens={setCalcTokens}
          />
        </Modal>
      ) : null}
      {freeNoteOpen ? (
        <FreeNoteDialog
          value={freeNote}
          onChange={(value) => onDraft({ ...draft, freeNote: value })}
          onClose={() => setFreeNoteOpen(false)}
        />
      ) : null}
    </main>
  );
}

function GuideRead({
  steps,
  index,
  onIndex,
  onClose,
}: {
  steps: readonly GuideStep[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const step = steps[index];
  if (!step) return null;
  return (
    <div className="guide-panel" data-guide-step={index}>
      <div className="guide-head">
        <p className="guide-text">{step.text}</p>
        <button type="button" className="text-button guide-close" onClick={onClose}>
          閉じる
        </button>
      </div>
      <div className="guide-nav">
        <button
          type="button"
          className="text-button"
          disabled={index === 0}
          onClick={() => onIndex(index - 1)}
        >
          前の説明
        </button>
        <span className="guide-count">
          {index + 1} / {steps.length}
        </span>
        <button
          type="button"
          className="text-button"
          disabled={index === steps.length - 1}
          onClick={() => onIndex(index + 1)}
        >
          次の説明
        </button>
      </div>
    </div>
  );
}

function memoPalette(problem: Problem): string[] {
  if (problem.type === "sequence-builder") return [...problem.availableAminoAcids];
  const codes = problem.choices
    .map((choice) => choice.sequence)
    .filter((code) => /^[A-Z]$/.test(code));
  if (codes.length > 0) return codes;
  return [...new Set(problem.sequence)];
}
