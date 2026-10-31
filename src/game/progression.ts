import type { Problem, Stage } from "./types.ts";

export type Progress = {
  clearedProblemIds: string[];
  lastProblemId: string | null;
};

export function flowIds(stages: readonly Stage[]): string[] {
  return stages.flatMap((stage) => [
    ...(stage.briefingId ? [stage.briefingId] : []),
    ...stage.problemIds,
  ]);
}

export function orderedProblemIds(stages: readonly Stage[]): string[] {
  return stages.flatMap((stage) => stage.problemIds);
}

export function isBriefingId(stages: readonly Stage[], id: string): boolean {
  return stages.some((stage) => stage.briefingId === id);
}

export function nextFlowId(stages: readonly Stage[], currentId: string): string | null {
  const ids = flowIds(stages);
  const index = ids.indexOf(currentId);
  if (index < 0 || index >= ids.length - 1) return null;
  return ids[index + 1] ?? null;
}

/** いま読んだ説明のあとで、まだ終えていない次の説明か問題。 */
export function nextUnclearedId(
  stages: readonly Stage[],
  clearedProblemIds: readonly string[],
  afterId: string,
): string | null {
  const ids = flowIds(stages);
  const start = ids.indexOf(afterId) + 1;
  if (start <= 0) return null;
  for (const id of ids.slice(start)) {
    if (clearedProblemIds.includes(id)) continue;
    if (!isFlowOpen(id, stages, clearedProblemIds)) return null;
    return id;
  }
  return null;
}

export function isStageOpen(
  stage: Stage,
  stages: readonly Stage[],
  clearedProblemIds: readonly string[],
): boolean {
  const index = stages.findIndex((item) => item.id === stage.id);
  if (index <= 0) return true;
  return stages
    .slice(0, index)
    .every((earlier) => earlier.problemIds.every((id) => clearedProblemIds.includes(id)));
}

export function isProblemOpen(
  problemId: string,
  stages: readonly Stage[],
  clearedProblemIds: readonly string[],
): boolean {
  const stage = stages.find((item) => item.problemIds.includes(problemId));
  if (!stage || !isStageOpen(stage, stages, clearedProblemIds)) return false;
  if (clearedProblemIds.includes(problemId)) return true;
  if (stage.briefingId && !clearedProblemIds.includes(stage.briefingId)) return false;
  const earlier = stage.problemIds.slice(0, stage.problemIds.indexOf(problemId));
  return earlier.every((id) => clearedProblemIds.includes(id));
}

export function continueTarget(
  stages: readonly Stage[],
  problems: readonly Problem[],
  progress: Progress,
): string | null {
  const known = new Set([
    ...flowIds(stages),
    ...problems.map((problem) => problem.id),
  ]);
  if (
    progress.lastProblemId &&
    known.has(progress.lastProblemId) &&
    !progress.clearedProblemIds.includes(progress.lastProblemId) &&
    isFlowOpen(progress.lastProblemId, stages, progress.clearedProblemIds)
  ) {
    return progress.lastProblemId;
  }
  for (const id of flowIds(stages)) {
    if (progress.clearedProblemIds.includes(id)) continue;
    if (isFlowOpen(id, stages, progress.clearedProblemIds)) return id;
  }
  return null;
}

export function stageComplete(
  stage: Stage,
  clearedProblemIds: readonly string[],
): boolean {
  return stage.problemIds.every((id) => clearedProblemIds.includes(id));
}

function isFlowOpen(
  id: string,
  stages: readonly Stage[],
  clearedProblemIds: readonly string[],
): boolean {
  const briefingStage = stages.find((stage) => stage.briefingId === id);
  if (briefingStage) return isStageOpen(briefingStage, stages, clearedProblemIds);
  return isProblemOpen(id, stages, clearedProblemIds);
}
