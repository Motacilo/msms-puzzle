import type { Progress } from "../game/progression.ts";

const STORAGE_KEY = "msms-puzzle-progress-v1";

export const emptyProgress: Progress = {
  clearedProblemIds: [],
  lastProblemId: null,
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyProgress;
    const record = parsed as Partial<Progress>;
    const clearedProblemIds = Array.isArray(record.clearedProblemIds)
      ? record.clearedProblemIds.filter((id): id is string => typeof id === "string")
      : [];
    const lastProblemId =
      typeof record.lastProblemId === "string" ? record.lastProblemId : null;
    return { clearedProblemIds, lastProblemId };
  } catch {
    return emptyProgress;
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // 保存に失敗しても、いまの画面では遊び続けられる。
  }
}
