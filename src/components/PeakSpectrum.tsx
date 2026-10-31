import { useLayoutEffect, useRef, useState } from "react";
import type { Peak } from "../game/types.ts";

type Props = {
  peaks: readonly Peak[];
  notes?: Record<string, string>;
  onSelect?: (peakId: string) => void;
};

type Placement = {
  left: number;
  top: number;
};

export function PeakSpectrum({ peaks, notes = {}, onSelect }: Props) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [placements, setPlacements] = useState<Record<string, Placement>>({});
  const axisMax = axisMaxFor(Math.max(...peaks.map((peak) => peak.mass), 1));
  const ticks = ticksFor(axisMax);
  const masses = [...peaks]
    .sort((a, b) => a.mass - b.mass)
    .map((peak) => peak.mass)
    .join("、");
  const peakKey = peaks
    .map((peak) => `${peak.id}:${peak.mass}:${peak.intensity}:${notes[peak.id] ?? ""}`)
    .join("|");

  useLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;

    const place = () => {
      setPlacements(placeMassLabels(plot));
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(plot);
    return () => observer.disconnect();
  }, [peakKey]);

  return (
    <figure className="spectrum-figure">
      <div className="spectrum-stage">
        <span className="intensity-label">強度</span>
        <div
          className="spectrum-plot"
          ref={plotRef}
          role="group"
          aria-label={`質量スペクトル。左が軽く、右が重い。ピークの質量は ${masses}。線の高さは強度で、順番の判定には使いません。ピークを押すと、かけらのメモを登録できます。`}
        >
          {peaks.map((peak) => {
            const note = notes[peak.id];
            return (
              <button
                key={peak.id}
                type="button"
                className="peak-hit"
                style={{ left: `${(peak.mass / axisMax) * 100}%` }}
                aria-label={
                  note
                    ? `質量 ${peak.mass}、メモ ${note}。かけらのメモを編集`
                    : `質量 ${peak.mass}。かけらのメモを登録`
                }
                onClick={() => onSelect?.(peak.id)}
              >
                <span
                  className="peak-line"
                  data-id={peak.id}
                  style={{ height: `${peak.intensity * 70}%` }}
                />
              </button>
            );
          })}
          {peaks.map((peak) => {
            const placement = placements[peak.id];
            const note = notes[peak.id];
            return (
              <button
                key={peak.id}
                type="button"
                className="peak-mass"
                data-id={peak.id}
                style={
                  placement
                    ? { left: placement.left, top: placement.top }
                    : { left: 0, top: 0, visibility: "hidden" }
                }
                aria-label={
                  note
                    ? `質量 ${peak.mass}、メモ ${note}。かけらのメモを編集`
                    : `質量 ${peak.mass}。かけらのメモを登録`
                }
                onClick={() => onSelect?.(peak.id)}
              >
                {note ? <span className="peak-note">{note}</span> : null}
                <span className="peak-value">{peak.mass}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="spectrum-scale">
        {ticks.map((tick) => (
          <span key={tick} style={{ left: `${(tick / axisMax) * 100}%` }}>
            {tick}
          </span>
        ))}
      </div>
      <div className="spectrum-ends">
        <span>軽い</span>
        <span className="spectrum-arrow" aria-hidden="true" />
        <span>重い</span>
      </div>
      <p className="spectrum-note">ピークを押すと、かけらのメモを登録できます。</p>
    </figure>
  );
}

type Box = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

function placeMassLabels(plot: HTMLElement): Record<string, Placement> {
  const plotRect = plot.getBoundingClientRect();
  const lines = [...plot.querySelectorAll<HTMLElement>(".peak-line")];
  const labels = [...plot.querySelectorAll<HTMLElement>(".peak-mass")];
  const sizes = new Map(
    labels.map((label) => {
      const rect = label.getBoundingClientRect();
      return [label.dataset.id ?? "", { w: rect.width, h: rect.height }] as const;
    }),
  );

  const lineBoxes = lines.map((line) => {
    const rect = line.getBoundingClientRect();
    return {
      id: line.dataset.id ?? "",
      x: rect.left - plotRect.left,
      y: rect.top - plotRect.top,
      w: Math.max(rect.width, 2),
      h: rect.height,
    };
  });

  const gap = 5;
  const items: Box[] = lineBoxes.map((line) => {
    const size = sizes.get(line.id) ?? { w: 28, h: 18 };
    return {
      id: line.id,
      x: line.x + line.w / 2 - size.w / 2,
      y: line.y - size.h - gap,
      w: size.w,
      h: size.h,
    };
  });
  items.sort((a, b) => a.x - b.x);

  for (const item of items) {
    for (let step = 0; step < 40; step += 1) {
      const labelHit = items.find(
        (other) => other.id !== item.id && overlaps(item, other, 3),
      );
      if (labelHit) {
        if (labelHit.x <= item.x) item.x = labelHit.x + labelHit.w + 4;
        else item.x = labelHit.x - item.w - 4;
        continue;
      }

      const lineHit = lineBoxes.find(
        (line) => line.id !== item.id && overlaps(item, line, 2),
      );
      if (lineHit) {
        const beside = item.x + item.w / 2 >= lineHit.x;
        const shifted = beside ? lineHit.x + lineHit.w + 4 : lineHit.x - item.w - 4;
        const fits =
          shifted >= 0 &&
          shifted + item.w <= plotRect.width &&
          !lineBoxes.some(
            (line) =>
              line.id !== item.id &&
              overlaps({ ...item, x: shifted }, line, 2),
          );
        if (fits) item.x = shifted;
        else item.y = lineHit.y - item.h - gap;
        continue;
      }
      break;
    }

    if (item.x < 0) item.x = 0;
    if (item.x + item.w > plotRect.width) item.x = Math.max(0, plotRect.width - item.w);
    if (item.y < 0) item.y = 0;
  }

  return Object.fromEntries(items.map((item) => [item.id, { left: item.x, top: item.y }]));
}

function overlaps(a: Box, b: Box, pad: number): boolean {
  return (
    a.x < b.x + b.w + pad &&
    a.x + a.w + pad > b.x &&
    a.y < b.y + b.h + pad &&
    a.y + a.h + pad > b.y
  );
}

function axisMaxFor(mass: number): number {
  const step = mass > 200 ? 50 : 20;
  let max = Math.ceil(mass / step) * step;
  if (mass / max > 0.88) max += step;
  return max;
}

function ticksFor(max: number): number[] {
  const step = max <= 120 ? 20 : 100;
  const ticks: number[] = [];
  for (let value = 0; value <= max; value += step) ticks.push(value);
  return ticks;
}
