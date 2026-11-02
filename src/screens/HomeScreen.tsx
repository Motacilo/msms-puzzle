import type { Briefing, Problem, Stage } from "../game/types.ts";
import type { PracticeResults } from "../storage/practiceStorage.ts";

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
  /** 練習問題。ロックはなく、どれからでも始められる。 */
  practiceStages: readonly Stage[];
  practiceProblems: readonly Problem[];
  practiceResults: PracticeResults;
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
  practiceStages,
  practiceProblems,
  practiceResults,
}: Props) {
  const continueIsBriefing = stages.some((stage) => stage.briefingId === continueProblemId);
  return (
    <main className="app">
      <p className="eyebrow">質量分析の入門パズル</p>
      <h1>ペプチドのかけら</h1>
      <p className="home-lead">ピークの質量から、ペプチドのアミノ酸の並びを読みます。</p>
      {continueProblemId ? (
        <button type="button" className="primary" onClick={onContinue}>
          {continueIsBriefing ? "図を見る" : "続きから遊ぶ"}
        </button>
      ) : (
        <p className="note">ここまでの図と問題はすべて見ています。もう一度開いてみてください。</p>
      )}
      <h2 className="home-section">チュートリアル</h2>
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
                  <h2>{stage.problemIds.length === 0 ? `${stageIndex + 1}. ${stage.title}` : "図"}</h2>
                  {stage.problemIds.length === 0 ? <p>{stage.summary}</p> : null}
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
              {stage.problemIds.length === 0 ? null : (
              <section className={open ? "stage" : "stage is-locked"}>
                <h2>
                  {stageIndex + 1}. {stage.title}
                </h2>
                <p>{stage.summary}</p>
                {open ? null : <p className="note">前のステージを終えると開きます。</p>}
                {waitingForBriefing ? (
                  <p className="note">図を見ると、まだ解いていない問題が開きます。</p>
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
              )}
            </div>
          );
        })}
      </div>
      <h2 className="home-section">練習問題</h2>
      <p className="note">
        3〜7残基を10問ずつ。ピークの見え方が問題ごとに違います。どの問題からでも始められます。
      </p>
      <div className="stage-list">
        {practiceStages.map((stage) => {
          const items = stage.problemIds.flatMap((id) => {
            const problem = practiceProblems.find((item) => item.id === id);
            return problem ? [problem] : [];
          });
          const correct = items.filter((item) => practiceResults[item.id] === "correct").length;
          return (
            <section key={stage.id} className="stage">
              <h2>
                {stage.title}
                <span className="status"> 　正解 {correct} / {items.length}</span>
              </h2>
              <ol>
                {items.map((problem) => {
                  const result = practiceResults[problem.id];
                  return (
                    <li key={problem.id}>
                      <button
                        type="button"
                        className="problem-row"
                        onClick={() => onOpen(problem.id)}
                      >
                        <span>{problem.title}</span>
                        <span className="status">
                          {result === "correct" ? "正解" : result === "incorrect" ? "不正解" : "未着手"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
      <button type="button" className="text-button" onClick={onReset}>
        記録を消す
      </button>
    </main>
  );
}
