import { useEffect, useState } from "react";
import { aminoAcids } from "../data/aminoAcids.ts";
import { briefings } from "../data/briefings.ts";
import { practiceProblems, practiceStages } from "../data/practice.ts";
import { problems } from "../data/problems.ts";
import { stages } from "../data/stages.ts";
import { assessAnswer } from "../game/evaluateAnswer.ts";
import {
  continueTarget,
  isBriefingId,
  isProblemOpen,
  isStageOpen,
  nextFlowId,
  nextUnclearedId,
  type Progress,
} from "../game/progression.ts";
import type { AnswerDraft, Judgment } from "../game/types.ts";
import { AnalysisScreen } from "../screens/AnalysisScreen.tsx";
import { BriefingScreen } from "../screens/BriefingScreen.tsx";
import { HomeScreen } from "../screens/HomeScreen.tsx";
import { LicensesScreen } from "../screens/LicensesScreen.tsx";
import { ResultScreen } from "../screens/ResultScreen.tsx";
import {
  loadPracticeResults,
  savePracticeResults,
  type PracticeResults,
} from "../storage/practiceStorage.ts";
import { emptyProgress, loadProgress, saveProgress } from "../storage/progressStorage.ts";

type FinishedJudgment = Exclude<Judgment, { status: "incomplete" }>;

type Route =
  | { name: "home" }
  | { name: "licenses" }
  | { name: "briefing"; briefingId: string }
  | { name: "play"; problemId: string }
  | { name: "result"; problemId: string; judgment: FinishedJudgment };

const allProblems = [...problems, ...practiceProblems];
const allStages = [...stages, ...practiceStages];
const practiceIds = new Set(practiceProblems.map((problem) => problem.id));

const emptyDraft = (): AnswerDraft => ({ choiceId: null, placed: [], memos: {} });

export function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [drafts, setDrafts] = useState<Record<string, AnswerDraft>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [practiceResults, setPracticeResults] = useState<PracticeResults>(loadPracticeResults);

  // 画面が変わったら、いちばん上から見せる（下のほうで回答しても、結果の演出が見えるように）。
  const routeKey =
    route.name === "home" ? "home" : route.name === "briefing" ? route.briefingId : `${route.name}:${route.problemId}`;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [routeKey]);

  function remember(next: Progress) {
    setProgress(next);
    saveProgress(next);
  }

  function openItem(id: string, base: Progress = progress) {
    setNotice(null);
    remember({ ...base, lastProblemId: id });
    if (isBriefingId(stages, id)) {
      setRoute({ name: "briefing", briefingId: id });
      return;
    }
    setRoute({ name: "play", problemId: id });
  }

  function finishBriefing(briefingId: string) {
    const clearedProblemIds = progress.clearedProblemIds.includes(briefingId)
      ? progress.clearedProblemIds
      : [...progress.clearedProblemIds, briefingId];
    const upcoming = nextUnclearedId(stages, clearedProblemIds, briefingId);
    if (!upcoming) {
      remember({ clearedProblemIds, lastProblemId: briefingId });
      setNotice(null);
      setRoute({ name: "home" });
      return;
    }
    openItem(upcoming, { clearedProblemIds, lastProblemId: upcoming });
  }

  function submit(problemId: string) {
    const problem = allProblems.find((item) => item.id === problemId);
    if (!problem) return;
    const draft = drafts[problemId] ?? emptyDraft();
    const judgment = assessAnswer(problem, draft);
    if (judgment.status === "incomplete") {
      setNotice(judgment.message);
      return;
    }
    const clearedProblemIds = progress.clearedProblemIds.includes(problemId)
      ? progress.clearedProblemIds
      : [...progress.clearedProblemIds, problemId];
    remember({ clearedProblemIds, lastProblemId: problemId });
    if (practiceIds.has(problemId)) {
      const next: PracticeResults = { ...practiceResults, [problemId]: judgment.status };
      setPracticeResults(next);
      savePracticeResults(next);
    }
    setNotice(null);
    setRoute({ name: "result", problemId, judgment });
  }

  if (route.name === "licenses") {
    return <LicensesScreen onHome={() => setRoute({ name: "home" })} />;
  }

  if (route.name === "briefing") {
    const briefing = briefings.find((item) => item.id === route.briefingId);
    if (!briefing) return null;
    const clearedAfter = progress.clearedProblemIds.includes(briefing.id)
      ? progress.clearedProblemIds
      : [...progress.clearedProblemIds, briefing.id];
    const upcoming = nextUnclearedId(stages, clearedAfter, briefing.id);
    const nextLabel = !upcoming
      ? null
      : isBriefingId(stages, upcoming)
        ? "次の図"
        : "次の問題";
    return (
      <BriefingScreen
        key={briefing.id}
        briefing={briefing}
        nextLabel={nextLabel}
        onNext={() => finishBriefing(briefing.id)}
        onHome={() => {
          setNotice(null);
          setRoute({ name: "home" });
        }}
      />
    );
  }

  if (route.name === "play") {
    const problem = allProblems.find((item) => item.id === route.problemId);
    const stage = allStages.find((item) => item.id === problem?.stageId);
    if (!problem || !stage) return null;
    const index = stage.problemIds.indexOf(problem.id) + 1;
    return (
      <AnalysisScreen
        key={problem.id}
        stageTitle={stage.title}
        indexLabel={`${index} / ${stage.problemIds.length}`}
        problem={problem}
        acids={aminoAcids}
        draft={drafts[problem.id] ?? emptyDraft()}
        notice={notice}
        onDraft={(draft) => {
          setDrafts((current) => ({ ...current, [problem.id]: draft }));
          setNotice(null);
        }}
        onSubmit={() => submit(problem.id)}
        onHome={() => {
          setNotice(null);
          setRoute({ name: "home" });
        }}
      />
    );
  }

  if (route.name === "result") {
    const problem = allProblems.find((item) => item.id === route.problemId);
    if (!problem) return null;
    const upcoming = nextFlowId(practiceIds.has(problem.id) ? practiceStages : stages, problem.id);
    return (
      <ResultScreen
        problem={problem}
        acids={aminoAcids}
        judgment={route.judgment}
        nextProblemId={upcoming}
        nextIsBriefing={upcoming !== null && isBriefingId(stages, upcoming)}
        onNext={() => {
          if (upcoming) openItem(upcoming);
        }}
        onRetry={() => {
          setDrafts((current) => ({ ...current, [problem.id]: emptyDraft() }));
          setNotice(null);
          setRoute({ name: "play", problemId: problem.id });
        }}
        onHome={() => setRoute({ name: "home" })}
      />
    );
  }

  const continueProblemId = continueTarget(stages, problems, progress);
  return (
    <HomeScreen
      stages={stages}
      briefings={briefings}
      problems={problems}
      clearedProblemIds={progress.clearedProblemIds}
      continueProblemId={continueProblemId}
      isStageOpen={(stage) => isStageOpen(stage, stages, progress.clearedProblemIds)}
      isProblemOpen={(problemId) =>
        isProblemOpen(problemId, stages, progress.clearedProblemIds)
      }
      onContinue={() => {
        if (continueProblemId) openItem(continueProblemId);
      }}
      onOpen={openItem}
      practiceStages={practiceStages}
      practiceProblems={practiceProblems}
      practiceResults={practiceResults}
      lastProblemId={progress.lastProblemId}
      onReset={() => {
        remember(emptyProgress);
        setPracticeResults({});
        savePracticeResults({});
        setDrafts({});
        setRoute({ name: "home" });
      }}
      onOpenLicenses={() => setRoute({ name: "licenses" })}
    />
  );
}
