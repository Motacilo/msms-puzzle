import type { Briefing, Problem, Stage } from "../game/types.ts";

type Props = {
  stages: readonly Stage[];
  briefings: readonly Briefing[];
  problems: readonly Problem[];
  clearedProblemIds: readonly string[];
  continueProblemId: string | null;
  isStageOpen: (stage: Stage) => boolean;
  isProblemOpen: (problemId: string) => boolean;
  onContinue: () => void;
  onOpen: (id: string) => void;
  onReset: () => void;
};

export function HomeScreen({
  stages,
  briefings,
  problems,
  clearedProblemIds,
  continueProblemId,
  isStageOpen,
  isProblemOpen,
  onContinue,
  onOpen,
  onReset,
}: Props) {
  const continueIsBriefing = stages.some((stage) => stage.briefingId === continueProblemId);
  return (
    <main className="app">
      <p className="eyebrow">質量分析の入門パズル</p>
      <h1>ペプチドのかけら</h1>
      <p className="home-lead">
        サンプルに入っているタンパク質を、ペプチドの質量から特定します。各段階の前にある説明を読んでから、問題に進みます。
      </p>
      {continueProblemId ? (
        <button type="button" className="primary" onClick={onContinue}>
          {continueIsBriefing ? "説明を読む" : "続きから遊ぶ"}
        </button>
      ) : (
        <p className="note">ここまでの説明と問題はすべて見ています。もう一度開いてみてください。</p>
      )}
      <div className="stage-list">
        {stages.map((stage, stageIndex) => {
          const open = isStageOpen(stage);
          const briefing = briefings.find((item) => item.id === stage.briefingId);
          const briefingRead = briefing ? clearedProblemIds.includes(briefing.id) : true;
          const stageProblems = stage.problemIds.flatMap((id) => {
            const problem = problems.find((item) => item.id === id);
            return problem ? [problem] : [];
          });
          const waitingForBriefing =
            open && briefing !== undefined && !briefingRead && stageProblems.some((problem) => !clearedProblemIds.includes(problem.id));
          return (
            <div key={stage.id} className="stage-block">
              {briefing ? (
                <section className={open ? "briefing-entry" : "briefing-entry is-locked"}>
                  <h2>説明</h2>
                  <button
                    type="button"
                    className="problem-row"
                    disabled={!open}
                    onClick={() => onOpen(briefing.id)}
                  >
                    <span>{briefing.title}</span>
                    <span className="status">{briefingRead ? "読了" : "未読"}</span>
                  </button>
                  {open ? null : <p className="note">前のステージを終えると開きます。</p>}
                </section>
              ) : null}
              <section className={open ? "stage" : "stage is-locked"}>
                <h2>
                  {stageIndex + 1}. {stage.title}
                </h2>
                <p>{stage.summary}</p>
                {open ? null : <p className="note">前のステージを終えると開きます。</p>}
                {waitingForBriefing ? (
                  <p className="note">説明を読むと、まだ解いていない問題が開きます。</p>
                ) : null}
                <ol>
                  {stageProblems.map((problem) => {
                    const done = clearedProblemIds.includes(problem.id);
                    const playable = isProblemOpen(problem.id);
                    return (
                      <li key={problem.id}>
                        <button
                          type="button"
                          className="problem-row"
                          disabled={!playable}
                          onClick={() => onOpen(problem.id)}
                        >
                          <span>{problem.title}</span>
                          <span className="status">{done ? "完了" : "未着手"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            </div>
          );
        })}
      </div>
      <button type="button" className="text-button" onClick={onReset}>
        記録を消す
      </button>
    </main>
  );
}
