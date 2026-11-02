import { useState } from "react";
import { LessonPage } from "../components/LessonFigure.tsx";
import type { Briefing } from "../game/types.ts";

type Props = {
  briefing: Briefing;
  nextLabel: string | null;
  onNext: () => void;
  onHome: () => void;
};

export function BriefingScreen({ briefing, nextLabel, onNext, onHome }: Props) {
  const [index, setIndex] = useState(0);
  const page = briefing.pages[index];
  if (!page) return null;
  const last = index === briefing.pages.length - 1;

  return (
    <main className="app">
      <div className="play-top">
        <button type="button" className="text-button" onClick={onHome}>
          ホーム
        </button>
        <p className="eyebrow">
          図 · {index + 1} / {briefing.pages.length}
        </p>
      </div>
      <h1>{page.kicker}</h1>
      <div className="lesson-sentence">
        {page.text
          .split("。")
          .map((sentence) => sentence.trim())
          .filter(Boolean)
          .map((sentence) => (
            <p key={sentence}>{sentence}。</p>
          ))}
      </div>
      <LessonPage figure={page.figure} />
      <div className="guide-nav lesson-nav">
        <button
          type="button"
          className="text-button"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          前のページ
        </button>
        <span className="guide-count">
          {index + 1} / {briefing.pages.length}
        </span>
        {last ? (
          <button type="button" className="primary" onClick={onNext}>
            {nextLabel ?? "ステージ選択へ"}
          </button>
        ) : (
          <button type="button" className="primary" onClick={() => setIndex(index + 1)}>
            次のページ
          </button>
        )}
      </div>
    </main>
  );
}
