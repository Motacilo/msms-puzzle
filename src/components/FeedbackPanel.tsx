import type { ExplanationStep } from "../game/explainSolution.ts";
import type { Judgment } from "../game/types.ts";

type Props = {
  judgment: Exclude<Judgment, { status: "incomplete" }>;
  answerLabel: string;
  correctLabel: string;
  steps: ExplanationStep[];
  stepsTitle?: string;
  explanation: string;
  scienceNote?: string;
};

export function FeedbackPanel({
  judgment,
  answerLabel,
  correctLabel,
  steps,
  stepsTitle = "ピークとの対応",
  explanation,
  scienceNote,
}: Props) {
  const correct = judgment.status === "correct";
  return (
    <section className={correct ? "result is-correct" : "result is-incorrect"}>
      <p className="verdict">{correct ? "正解" : "不正解"}</p>
      <p>
        {correct
          ? "その読みで合っています。"
          : "考え方を確認して、次へ進めます。"}
      </p>
      <dl className="answer-compare">
        <div>
          <dt>あなたの回答</dt>
          <dd>{answerLabel}</dd>
        </div>
        <div>
          <dt>正解</dt>
          <dd>{correctLabel}</dd>
        </div>
      </dl>
      {steps.length > 0 ? (
        <>
          <h2>{stepsTitle}</h2>
          <ol className="steps">
            {steps.map((step) => (
              <li key={`${step.label}-${step.equation}`}>
                <span>{step.label}</span>
                <strong>{step.equation}</strong>
              </li>
            ))}
          </ol>
        </>
      ) : null}
      <p>{explanation}</p>
      {scienceNote ? (
        <aside className="science">
          <h2>補足</h2>
          <p>{scienceNote}</p>
        </aside>
      ) : null}
    </section>
  );
}
