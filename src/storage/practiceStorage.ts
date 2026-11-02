export type PracticeResult = "correct" | "incorrect";
export type PracticeResults = Record<string, PracticeResult>;

const STORAGE_KEY = "msms-puzzle-practice-v1";

export function loadPracticeResults(): PracticeResults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const results: PracticeResults = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === "correct" || value === "incorrect") results[id] = value;
    }
    return results;
  } catch {
    return {};
  }
}

export function savePracticeResults(results: PracticeResults): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // 保存に失敗しても、いまの画面では遊び続けられる。
  }
}
