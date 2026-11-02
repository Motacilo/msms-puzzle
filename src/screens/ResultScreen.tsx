import { FeedbackPanel } from "../components/FeedbackPanel.tsx";
import { PeptideChain } from "../components/PeptideChain.tsx";
import { explainSolution } from "../game/explainSolution.ts";
import { residueLabel, sequenceLabel } from "../game/labels.ts";
import {
  CANNOT_BUILD_LABEL,
  type AminoAcid,
  type Judgment,
  type Problem,
} from "../game/types.ts";

type Props = {
  problem: Problem;
  acids: readonly AminoAcid[];
  judgment: Exclude<Judgment, { status: "incomplete" }>;
  nextProblemId: string | null;
  nextIsBriefing?: boolean;
  onNext: () => void;
  onRetry: () => void;
  onHome: () => void;
};

function answerText(
  problem: Problem,
  sequence: string,
  acids: readonly AminoAcid[],
): string {
  if (sequence === CANNOT_BUILD_LABEL) return sequence;
  if (problem.type === "choice") {
    const choice = problem.choices.find((item) => item.sequence === sequence);
    if (choice?.label) return choice.label;
    if (problem.question.kind === "composition") return [...sequence].join("・");
  }
  if (sequence.length <= 1) return residueLabel(sequence, acids);
  return sequenceLabel(sequence, acids);
}

export function ResultScreen({
  problem,
  acids,
  judgment,
  nextProblemId,
  nextIsBriefing = false,
  onNext,
  onRetry,
  onHome,
}: Props) {
  const steps = explainSolution(problem, acids);
  const answerLabel = answerText(problem, judgment.answer, acids);
  const correctLabel = answerText(problem, judgment.correct, acids);

  return (
    <main className="app">
      <div className="play-top">
        <button type="button" className="text-button" onClick={onHome}>
          ホーム
        </button>
        <p className="eyebrow">{problem.title}</p>
      </div>
      {problem.type === "sequence-builder" ? (
        <div className="result-peptide">
          <p className="terminus-note">正解のペプチド</p>
          <PeptideChain
            acids={acids}
            residues={[...problem.correctSequence]}
            hydrogen
            hydroxyl
          />
        </div>
      ) : null}
      <FeedbackPanel
        judgment={judgment}
        answerLabel={answerLabel}
        correctLabel={correctLabel}
        steps={steps}
        explanation={problem.explanation}
        scienceNote={problem.scienceNote}
      />
      <div className="actions">
        {nextProblemId ? (
          <button type="button" className="primary" onClick={onNext}>
            {nextIsBriefing ? "次の図" : "次の問題"}
          </button>
        ) : (
          <button type="button" className="primary" onClick={onHome}>
            ステージ選択へ
          </button>
        )}
        <button type="button" className="secondary" onClick={onRetry}>
          もう一度
        </button>
        <button type="button" className="secondary" onClick={onHome}>
          ホーム
        </button>
      </div>
    </main>
  );
}
