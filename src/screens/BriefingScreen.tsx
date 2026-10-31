import type { Briefing } from "../game/types.ts";

type Props = {
  briefing: Briefing;
  nextLabel: string | null;
  onNext: () => void;
  onHome: () => void;
};

export function BriefingScreen({ briefing, nextLabel, onNext, onHome }: Props) {
  return (
    <main className="app">
      <div className="play-top">
        <button type="button" className="text-button" onClick={onHome}>
          ホーム
        </button>
        <p className="eyebrow">説明</p>
      </div>
      <h1>{briefing.title}</h1>
      <div className="briefing-copy">
        {briefing.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="actions">
        <button type="button" className="primary" onClick={onNext}>
          {nextLabel ?? "ステージ選択へ"}
        </button>
      </div>
    </main>
  );
}
