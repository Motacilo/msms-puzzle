import { FeedbackPanel } from "../components/FeedbackPanel.tsx";
import { ResultStage } from "../components/ResultStage.tsx";
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
  /** 回答した並び（並べて答える問題のとき、結果の演出に使う）。 */
  answer: readonly string[];
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
  answer,
  nextProblemId,
  nextIsBriefing = false,
  onNext,
  onRetry,
  onHome,
}: Props) {
  const steps = explainSolution(problem, acids);
  const answerLabel = answerText(problem, judgment.answer, acids);
  const correctLabel = answerText(problem, judgment.correct, acids);
  const correct = judgment.status === "correct";
  const staged = problem.type === "sequence-builder";
  const nextLabel = nextProblemId ? (nextIsBriefing ? "次の図へ" : "次の問題へ") : "ステージ選択へ";

  return (
    <main className="app">
      <div className="play-top">
        <button type="button" className="text-button" onClick={onHome}>
          ホーム
        </button>
        <p className="eyebrow">{problem.title}</p>
      </div>
      {problem.type === "sequence-builder" ? (
        <ResultStage
          key={`${problem.id}:${answer.join("|")}`}
          problem={problem}
          acids={acids}
          answer={answer}
          verdict={correct ? "correct" : "incorrect"}
        />
      ) : null}
      <div className="next-row">
        <button
          type="button"
          className={correct ? "primary next-big is-clear" : "primary next-big"}
          onClick={nextProblemId ? onNext : onHome}
        >
          <span>{nextLabel}</span>
          <span className="next-arrow" aria-hidden="true" />
        </button>
        {correct ? null : (
          <button type="button" className="secondary next-side" onClick={onRetry}>
            もう一度
          </button>
        )}
      </div>
      {staged ? null : (
      <FeedbackPanel
        judgment={judgment}
        answerLabel={answerLabel}
        correctLabel={correctLabel}
        steps={steps}
        explanation={problem.explanation}
        scienceNote={problem.scienceNote}
      />
      )}
      {staged ? null : (
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
      )}
    </main>
  );
}
