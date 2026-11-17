import { SpectrumThumbnail } from "../components/SpectrumThumbnail.tsx";
import { aminoAcids } from "../data/aminoAcids.ts";
import { buildPeptide, selectPeaks } from "../game/fragments.ts";
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
  onOpenLicenses: () => void;
  /** 練習問題。ロックはなく、どれからでも始められる。 */
  practiceStages: readonly Stage[];
  practiceProblems: readonly Problem[];
  practiceResults: PracticeResults;
  /** 最後に開いた図か問題。「つづきから」の行き先を決めるのに使う。 */
  lastProblemId: string | null;
};

/** 残基数ごとの難しさ。星の数と色味で示す。 */
const MAX_STARS = 5;

function Stars({ level }: { level: number }) {
  return (
    <span className="stars" role="img" aria-label={`難しさ ${level} / ${MAX_STARS}`}>
      {Array.from({ length: MAX_STARS }, (_, index) => (
        <span key={index} className={index < level ? "star is-on" : "star"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

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
  onOpenLicenses,
  practiceStages,
  practiceProblems,
  practiceResults,
  lastProblemId,
}: Props) {
  const continueIsBriefing = stages.some((stage) => stage.briefingId === continueProblemId);

  // 全体の進み具合。
  const practiceOrder = practiceStages.flatMap((stage) => stage.problemIds);
  const practiceCorrect = practiceOrder.filter((id) => practiceResults[id] === "correct").length;
  const tutorialIds = stages.flatMap((stage) => [
    ...(stage.briefingId ? [stage.briefingId] : []),
    ...stage.problemIds,
  ]);
  const tutorialDone = tutorialIds.filter((id) => clearedProblemIds.includes(id)).length;
  const percent = practiceOrder.length > 0 ? (practiceCorrect / practiceOrder.length) * 100 : 0;

  // 「つづきから」の行き先。最後に開いたのが練習問題なら練習問題を、そうでなければチュートリアルを先に出す。
  const lastPracticeIndex = lastProblemId ? practiceOrder.indexOf(lastProblemId) : -1;
  const unsolved = practiceOrder.filter((id) => practiceResults[id] !== "correct");
  const practiceNextId =
    unsolved.length === 0
      ? null
      : lastPracticeIndex < 0
        ? (unsolved[0] ?? null)
        : lastProblemId && practiceResults[lastProblemId] !== "correct"
          ? lastProblemId
          : (unsolved.find((id) => practiceOrder.indexOf(id) > lastPracticeIndex) ?? unsolved[0] ?? null);
  const practiceNext = practiceProblems.find((problem) => problem.id === practiceNextId) ?? null;
  const practiceNextLevel =
    practiceStages.findIndex((stage) => stage.problemIds.includes(practiceNextId ?? "")) + 1;
  const practiceFirst = practiceNext !== null && (lastPracticeIndex >= 0 || continueProblemId === null);
  const tutorialTitle =
    briefings.find((item) => item.id === continueProblemId)?.title ??
    problems.find((item) => item.id === continueProblemId)?.title ??
    "";
  const thumbPeaks = (problem: Problem) =>
    selectPeaks(buildPeptide(problem.sequence, aminoAcids).peaks, problem.shownPeakIds);

  return (
    <main className="app">
      <header className="home-head">
        <div className="home-title">
          <p className="eyebrow">質量分析の入門パズル</p>
          <h1>ペプチドのかけら</h1>
          <p className="home-lead">ピークの質量から、ペプチドのアミノ酸の並びを読みます。</p>
        </div>
        <div
          className="home-progress"
          role="img"
          aria-label={`練習問題は ${practiceOrder.length} 問中 ${practiceCorrect} 問正解。チュートリアルは ${tutorialIds.length} 個中 ${tutorialDone} 個完了。`}
        >
          <p className="progress-title">練習問題の正解</p>
          <p className="progress-count">
            <strong>{practiceCorrect}</strong>
            <span>/ {practiceOrder.length}</span>
          </p>
          <div className="progress-bar">
            <span style={{ width: `${percent}%` }} />
          </div>
          <p className="progress-sub">
            チュートリアル {tutorialDone} / {tutorialIds.length}
          </p>
        </div>
      </header>
      {practiceFirst && practiceNext ? (
        <section className="resume-card" data-level={practiceNextLevel} data-resume="practice">
          <span className="resume-thumb">
            <SpectrumThumbnail peaks={thumbPeaks(practiceNext)} />
          </span>
          <div className="resume-body">
            <p className="resume-kicker">つづきから</p>
            <p className="resume-title">
              練習問題 {practiceNext.title}
            </p>
            <div className="resume-actions">
              <button type="button" className="primary resume-go" onClick={() => onOpen(practiceNext.id)}>
                この問題を解く
              </button>
              {continueProblemId ? (
                <button type="button" className="secondary" onClick={onContinue}>
                  チュートリアルの続き
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : continueProblemId ? (
        <section className="resume-card" data-resume="tutorial">
          <div className="resume-body">
            <p className="resume-kicker">つづきから</p>
            <p className="resume-title">チュートリアル {tutorialTitle}</p>
            <div className="resume-actions">
              <button type="button" className="primary resume-go" onClick={onContinue}>
                {continueIsBriefing ? "図を見る" : "続きから遊ぶ"}
              </button>
              {practiceNext ? (
                <button type="button" className="secondary" onClick={() => onOpen(practiceNext.id)}>
                  練習問題 {practiceNext.title.split(" ")[0]} へ
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <p className="note">図と問題はすべて終えています。もう一度開いてみてください。</p>
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
        {practiceStages.map((stage, stageIndex) => {
          const level = Math.min(MAX_STARS, stageIndex + 1);
          const items = stage.problemIds.flatMap((id) => {
            const problem = practiceProblems.find((item) => item.id === id);
            return problem ? [problem] : [];
          });
          const correct = items.filter((item) => practiceResults[item.id] === "correct").length;
          return (
            <section key={stage.id} className="stage practice-stage" data-level={level}>
              <h2 className="practice-head">
                <span className="practice-name">{stage.title}</span>
                <Stars level={level} />
                <span className="status practice-score">
                  正解 {correct} / {items.length}
                </span>
              </h2>
              <div className="problem-grid">
                {items.map((problem) => {
                  const result = practiceResults[problem.id];
                  const state = result ?? "none";
                  const [number = "", ...rest] = problem.title.split(" ");
                  const peaks = thumbPeaks(problem);
                  const isNext = problem.id === practiceNextId;
                  return (
                    <button
                      key={problem.id}
                      type="button"
                      className={`problem-tile is-${state}${isNext ? " is-next" : ""}`}
                      onClick={() => onOpen(problem.id)}
                    >
                      <span className="tile-thumb">
                        <SpectrumThumbnail peaks={peaks} />
                        {isNext ? <span className="tile-next">つぎ</span> : null}
                        <span className="tile-status">
                          {result === "correct" ? "正解" : result === "incorrect" ? "不正解" : "未着手"}
                        </span>
                      </span>
                      <span className="tile-number">{number}</span>
                      <span className="tile-label">{rest.join(" ")}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <p className="home-legal">
        <button type="button" className="text-button" onClick={onOpenLicenses}>
          ライセンス
        </button>
        <button type="button" className="text-button" onClick={onReset}>
          記録を消す
        </button>
      </p>
    </main>
  );
}
