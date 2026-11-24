import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { fragmentLabel } from "../game/labels.ts";
import type { FragmentMemo, Peak, PeakColor } from "../game/types.ts";
import { FragmentLabel } from "./FragmentLabel.tsx";

/** 2つのピークの間のメモ。fromId は質量の小さいほう。 */
export type RangeNote = {
  key: string;
  fromId: string;
  toId: string;
  memos: readonly FragmentMemo[];
};

type Props = {
  peaks: readonly Peak[];
  /** ピークごとのメモ。1つのピークに複数ある。縦に並べて表示する。 */
  notes?: Record<string, readonly FragmentMemo[]>;
  /** ピークの間のメモ。青で、隣のピークなら間に線を、そうでなければかすがい状につないで表示する。 */
  rangeNotes?: readonly RangeNote[];
  /** ピークごとの色。ないピークは黒。 */
  peakColors?: Record<string, PeakColor>;
  /** 正解の演出で、光らせたままにするピーク。 */
  litPeakIds?: readonly string[];
  /** 正解の演出で、いま光ったピーク。 */
  flashPeakIds?: readonly string[];
  /** 結果画面で、かけらで説明できなかったピーク（赤く示す）。 */
  missPeakIds?: readonly string[];
  /** 図の上に重ねるもの（正解の演出の文字など）。 */
  overlay?: ReactNode;
  /** 1回押して選択中のピーク（赤く表示する）。 */
  selectedPeakId?: string | null;
  onSelectRange?: (fromId: string, toId: string) => void;
  /** ピークのない場所を押したとき。 */
  onBlankClick?: () => void;
  guidePeakId?: string;
  guidePeakIds?: readonly string[];
  /** 図解用。押せず、メモの案内も出さない。 */
  readOnly?: boolean;
  compact?: boolean;
  onSelect?: (peakId: string) => void;
};

type Placement = {
  left: number;
  top: number;
  arrow: Arrow | null;
};

type Arrow = {
  left: number;
  top: number;
  height: number;
};

type RangeItem = { key: string; left: number; top: number; path: string };
type RangeLayout = { items: RangeItem[]; extraTop: number };
const NO_RANGES: RangeLayout = { items: [], extraTop: 0 };

export function PeakSpectrum({
  peaks,
  notes = {},
  rangeNotes = [],
  peakColors = {},
  litPeakIds = [],
  flashPeakIds = [],
  missPeakIds = [],
  overlay,
  selectedPeakId = null,
  onSelectRange,
  onBlankClick,
  guidePeakId,
  guidePeakIds,
  readOnly = false,
  compact = false,
  onSelect,
}: Props) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [placements, setPlacements] = useState<Record<string, Placement>>({});
  const [rangeLayout, setRangeLayout] = useState<RangeLayout>(NO_RANGES);
  // メモが多くてラベルが図の上にはみ出すとき、その分だけ図の上に余白を足す。
  const [labelExtra, setLabelExtra] = useState(0);
  const axisMax = spectrumAxisMax(peaks);
  const ticks = ticksFor(axisMax);
  const masses = [...peaks]
    .sort((a, b) => a.mass - b.mass)
    .map((peak) => peak.mass)
    .join("、");
  const guided = new Set(guidePeakIds ?? (guidePeakId ? [guidePeakId] : []));
  const peakKey = `${peaks
    .map(
      (peak) =>
        `${peak.id}:${peak.mass}:${peak.intensity}:${(notes[peak.id] ?? []).map(fragmentLabel).join(",")}`,
    )
    .join("|")}|guide:${[...guided].join(",")}|ranges:${rangeNotes
    .map((range) => `${range.key}=${range.memos.map(fragmentLabel).join(",")}`)
    .join("|")}`;

  useLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;

    const masses = new Map(peaks.map((peak) => [peak.id, peak.mass]));
    const place = () => {
      const placed = placeMassLabels(plot);
      setPlacements(placed);
      const highest = Math.min(0, ...Object.values(placed).map((item) => item.top));
      setLabelExtra(Math.ceil(-highest) + (highest < 0 ? 4 : 0));
      setRangeLayout(placeRanges(plot, placed, rangeNotes, masses));
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(plot);
    return () => observer.disconnect();
  }, [peakKey]);

  return (
    <figure
      className={[
        "spectrum-figure",
        compact ? "is-compact" : "",
        guided.size > 0 ? "is-focus" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="spectrum-stage"
        style={
          Math.max(rangeLayout.extraTop, labelExtra) > 0
            ? { paddingTop: Math.max(rangeLayout.extraTop, labelExtra) }
            : undefined
        }
      >
        <span className="intensity-label">強度</span>
        <div
          className="spectrum-plot"
          ref={plotRef}
          onClick={(event) => {
            if (event.target === event.currentTarget) onBlankClick?.();
          }}
          role="group"
          aria-label={
            readOnly
              ? `質量スペクトル。左が軽く、右が重い。ピークの質量は ${masses}。`
              : `質量スペクトル。左が軽く、右が重い。ピークの質量は ${masses}。線の高さは強度で、順番の判定には使いません。ピークを1回押すと選択、同じピークをもう1回押すとそのピークのメモ、別のピークを押すと2つのピークの間のメモを登録できます。`
          }
        >
          {peaks.map((peak) => {
            const note = notes[peak.id]?.length ? notes[peak.id] : undefined;
            const className = [
              "peak-hit",
              guided.has(peak.id) ? "is-guided" : "",
              selectedPeakId === peak.id ? "is-selected" : "",
              litPeakIds.includes(peak.id) ? "is-lit" : "",
              flashPeakIds.includes(peak.id) ? "is-flash" : "",
              missPeakIds.includes(peak.id) ? "is-miss" : "",
            ]
              .filter(Boolean)
              .join(" ");
            const style = { left: `${(peak.mass / axisMax) * 100}%` };
            const label = peakAria(peak, note, readOnly, selectedPeakId === peak.id);
            const line = (
              <span
                className="peak-line"
                data-id={peak.id}
                data-color={colorOf(peakColors, peak.id)}
                style={{ height: `${peak.intensity * 70}%` }}
              />
            );
            return readOnly ? (
              <span
                key={peak.id}
                className={className}
                data-guided={guided.has(peak.id) ? "" : undefined}
                style={style}
                aria-label={label}
              >
                {line}
              </span>
            ) : (
              <button
                key={peak.id}
                type="button"
                className={className}
                data-guided={guided.has(peak.id) ? "" : undefined}
                style={style}
                aria-label={label}
                aria-pressed={selectedPeakId === peak.id}
                onClick={() => onSelect?.(peak.id)}
              >
                {line}
              </button>
            );
          })}
          {peaks.map((peak) => {
            const arrow = placements[peak.id]?.arrow;
            if (!arrow) return null;
            return (
              <span
                key={`${peak.id}-arrow`}
                className="peak-arrow"
                style={{ left: arrow.left, top: arrow.top, height: arrow.height }}
                aria-hidden="true"
              />
            );
          })}
          {peaks.map((peak) => {
            const placement = placements[peak.id];
            const note = notes[peak.id]?.length ? notes[peak.id] : undefined;
            const className = [
              "peak-mass",
              guided.has(peak.id) ? "is-guided" : "",
              selectedPeakId === peak.id ? "is-selected" : "",
              litPeakIds.includes(peak.id) ? "is-lit" : "",
              missPeakIds.includes(peak.id) ? "is-miss" : "",
            ]
              .filter(Boolean)
              .join(" ");
            const style = placement
              ? { left: placement.left, top: placement.top }
              : { left: 0, top: 0, visibility: "hidden" as const };
            const label = peakAria(peak, note, readOnly, selectedPeakId === peak.id);
            const body = (
              <>
                {guided.has(peak.id) ? (
                  <span className="peak-pointer" aria-hidden="true" />
                ) : null}
                {note ? (
                  <span className="peak-note">
                    {note.map((memo, index) => (
                      <span key={index} className="peak-note-item">
                        <FragmentLabel memo={memo} />
                      </span>
                    ))}
                  </span>
                ) : null}
                <span className="peak-value">{peak.mass}</span>
              </>
            );
            return readOnly ? (
              <span
                key={peak.id}
                className={className}
                data-id={peak.id}
                data-color={colorOf(peakColors, peak.id)}
                style={style}
                aria-label={label}
              >
                {body}
              </span>
            ) : (
              <button
                key={peak.id}
                type="button"
                className={className}
                data-id={peak.id}
                data-color={colorOf(peakColors, peak.id)}
                style={style}
                aria-label={label}
                aria-pressed={selectedPeakId === peak.id}
                onClick={() => onSelect?.(peak.id)}
              >
                {body}
              </button>
            );
          })}
          <svg className="range-svg" aria-hidden="true">
            {rangeLayout.items.map((item) => (
              <path key={item.key} className="range-path" d={item.path} />
            ))}
          </svg>
          {rangeNotes.map((range) => {
            const item = rangeLayout.items.find((candidate) => candidate.key === range.key);
            const style = item
              ? { left: item.left, top: item.top }
              : { left: 0, top: 0, visibility: "hidden" as const };
            const text = range.memos.map(fragmentLabel).join("、");
            const body = range.memos.map((memo, index) => (
              <span key={index} className="range-note-line">
                <FragmentLabel memo={memo} />
              </span>
            ));
            return readOnly ? (
              <span key={range.key} className="range-note" data-key={range.key} style={style}>
                {body}
              </span>
            ) : (
              <button
                key={range.key}
                type="button"
                className="range-note"
                data-key={range.key}
                style={style}
                aria-label={`2つのピークの間のメモ ${text}。編集`}
                onClick={() => onSelectRange?.(range.fromId, range.toId)}
              >
                {body}
              </button>
            );
          })}
          {overlay}
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
      {readOnly ? null : (
        <p className="spectrum-note">
          {selectedPeakId
            ? "もう一度押すとそのピークのメモ。別のピークを押すと、2つの間のメモ。"
            : "ピークを1回押すと選択。もう1回でそのピークのメモ、別のピークを押すと間のメモ。"}
        </p>
      )}
    </figure>
  );
}

/** 黒は属性を付けない（色の指定がないときと同じ見た目）。 */
function colorOf(colors: Record<string, PeakColor>, id: string): PeakColor | undefined {
  const color = colors[id];
  return color && color !== "black" ? color : undefined;
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
  const lineById = new Map(lineBoxes.map((line) => [line.id, line]));

  const gap = 5;
  const items: Box[] = lineBoxes.map((line) => {
    const size = sizes.get(line.id) ?? { w: 28, h: 18 };
    const x = line.x + line.w / 2 - size.w / 2;
    return {
      id: line.id,
      x: Math.min(Math.max(0, x), Math.max(0, plotRect.width - size.w)),
      y: line.y - size.h - gap,
      w: size.w,
      h: size.h,
    };
  });
  const coversForeignLine = (item: Box) =>
    lineBoxes.some((line) => line.id !== item.id && overlaps(item, line, 2));
  const anchored = items.filter((item) => !coversForeignLine(item));
  const intruders = items.filter((item) => coversForeignLine(item));
  anchored.sort((a, b) => a.x - b.x);
  intruders.sort((a, b) => a.x - b.x);

  const placed: Box[] = [];
  for (const item of anchored) liftClear(item, placed, lineBoxes, gap);
  for (const item of intruders) liftClear(item, placed, lineBoxes, gap);

  return Object.fromEntries(
    items.map((item) => {
      const line = lineById.get(item.id);
      const tip = line ? line.y : item.y + item.h + gap;
      const distance = tip - (item.y + item.h);
      const raised = distance > gap + 8;
      // 矢じりの先がピークに触れないように、先端とピークの間に少し余白を取る。
      const arrowHeight = raised ? Math.max(0, distance - ARROW_GAP) : 0;
      const center = line ? line.x + line.w / 2 : item.x + item.w / 2;
      return [
        item.id,
        {
          left: item.x,
          top: item.y,
          arrow:
            arrowHeight >= 8
              ? { left: center, top: item.y + item.h + 1, height: arrowHeight }
              : null,
        },
      ];
    }),
  );
}

/** 矢印の下端（矢じりの先）からピークの先までの余白（px）。矢じりは線の下端より少し下に出るので、その分も含む。 */
const ARROW_GAP = 8;

function liftClear(item: Box, placed: Box[], lines: readonly Box[], gap: number) {
  for (let step = 0; step < 48; step += 1) {
    const obstacles = [
      ...placed.filter((other) => overlaps(item, other, 4)),
      ...lines.filter((line) => line.id !== item.id && overlaps(item, line, 2)),
    ];
    if (obstacles.length === 0) break;
    const nextY = Math.min(...obstacles.map((obstacle) => obstacle.y - item.h - gap));
    if (nextY >= item.y - 0.5) break;
    // 図の上端で止めない。はみ出した分は、図の上の余白を広げて収める。
    item.y = nextY;
  }
  placed.push(item);
}

function overlaps(a: Box, b: Box, pad: number): boolean {
  return (
    a.x < b.x + b.w + pad &&
    a.x + a.w + pad > b.x &&
    a.y < b.y + b.h + pad &&
    a.y + a.h + pad > b.y
  );
}

/** 図の右端の質量。結果画面で、かけらの行き先を決めるのにも使う。 */
export function spectrumAxisMax(peaks: readonly Peak[]): number {
  return axisMaxFor(Math.max(...peaks.map((peak) => peak.mass), 1));
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

function peakAria(
  peak: Peak,
  note: readonly FragmentMemo[] | undefined,
  readOnly: boolean,
  selected: boolean,
): string {
  if (readOnly) return `質量 ${peak.mass}`;
  const memos = note ? `、メモ ${note.map(fragmentLabel).join("、")}` : "";
  const state = selected ? "。選択中。もう一度押すとメモを開きます" : "。押すと選択します";
  return `質量 ${peak.mass}${memos}${state}`;
}

/**
 * ピークの間のメモの置き場所を、実際の大きさから決める。
 * - 質量の順で隣り合うピークで、間に書ける幅があれば、間に横線を引き、その真ん中の上にメモを置く。
 * - 近すぎる、隣でない、メモがほかと重なる、のときは、ピークの上からかすがい状につなぎ、
 *   バーの上にメモを置く。かすがいどうしは重ならない段に積む。
 */
function placeRanges(
  plot: HTMLElement,
  placed: Record<string, Placement>,
  ranges: readonly RangeNote[],
  massById: ReadonlyMap<string, number>,
): RangeLayout {
  if (ranges.length === 0) return NO_RANGES;
  const plotRect = plot.getBoundingClientRect();
  const plotHeight = plotRect.height;

  const lines = new Map<string, { cx: number; top: number }>();
  for (const line of plot.querySelectorAll<HTMLElement>(".peak-line")) {
    const rect = line.getBoundingClientRect();
    lines.set(line.dataset.id ?? "", {
      cx: rect.left - plotRect.left + rect.width / 2,
      top: rect.top - plotRect.top,
    });
  }

  const obstacles: Box[] = [];
  const labelBoxes: Box[] = [];
  const labelTop = new Map<string, number>();
  for (const label of plot.querySelectorAll<HTMLElement>(".peak-mass")) {
    const id = label.dataset.id ?? "";
    const where = placed[id];
    if (!where) continue;
    const rect = label.getBoundingClientRect();
    const labelBox = { id, x: where.left, y: where.top, w: rect.width, h: rect.height };
    obstacles.push(labelBox);
    labelBoxes.push(labelBox);
    labelTop.set(id, where.top);
    if (where.arrow) {
      obstacles.push({
        id: `${id}-arrow`,
        x: where.arrow.left - 1,
        y: where.arrow.top,
        w: 2,
        h: where.arrow.height,
      });
    }
  }

  const sizes = new Map<string, { w: number; h: number }>();
  for (const note of plot.querySelectorAll<HTMLElement>(".range-note")) {
    const rect = note.getBoundingClientRect();
    sizes.set(note.dataset.key ?? "", { w: rect.width, h: rect.height });
  }

  const order = [...lines.keys()].sort(
    (a, b) => (massById.get(a) ?? 0) - (massById.get(b) ?? 0) || a.localeCompare(b),
  );
  const rank = new Map(order.map((id, index) => [id, index]));

  const items: RangeItem[] = [];
  type Staple = {
    range: RangeNote;
    xa: number;
    xb: number;
    ta: number;
    tb: number;
    w: number;
    h: number;
    level: number;
  };
  const staples: Staple[] = [];

  for (const range of ranges) {
    const first = lines.get(range.fromId);
    const second = lines.get(range.toId);
    const size = sizes.get(range.key);
    if (!first || !second || !size) continue;
    const [a, b] = first.cx <= second.cx ? [first, second] : [second, first];
    const ids = first.cx <= second.cx ? [range.fromId, range.toId] : [range.toId, range.fromId];
    const adjacent = Math.abs((rank.get(range.fromId) ?? 0) - (rank.get(range.toId) ?? 0)) === 1;
    const gap = b.cx - a.cx;
    const mid = (a.cx + b.cx) / 2;

    if (adjacent && gap >= size.w + 16) {
      const lineY = Math.min(plotHeight - 10, Math.max(a.top, b.top) + 18);
      const box: Box = { id: range.key, x: mid - size.w / 2, y: lineY - 4 - size.h, w: size.w, h: size.h };
      if (!obstacles.some((other) => overlaps(box, other, 2))) {
        items.push({
          key: range.key,
          left: box.x,
          top: box.y,
          path: `M ${a.cx} ${lineY} H ${b.cx} M ${a.cx} ${lineY - 4} V ${lineY + 4} M ${b.cx} ${lineY - 4} V ${lineY + 4}`,
        });
        continue;
      }
    }
    staples.push({
      range,
      xa: a.cx,
      xb: b.cx,
      ta: labelTop.get(ids[0] ?? "") ?? a.top,
      tb: labelTop.get(ids[1] ?? "") ?? b.top,
      w: size.w,
      h: size.h,
      level: 0,
    });
  }

  let extraTop = 0;
  if (staples.length > 0) {
    const base = Math.min(...obstacles.map((box) => box.y), ...staples.map((s) => Math.min(s.ta, s.tb))) - 12;
    staples.sort((p, q) => p.xb - p.xa - (q.xb - q.xa) || p.xa - q.xa);
    const spans: { level: number; from: number; to: number }[] = [];
    // かすがいの脚は、その位置にある一番上のラベル（質量やメモ）の上で止める。
    // ほかのピークのメモが上に積まれていても、文字の上を線が通らない。
    const legEnd = (x: number, own: number) => {
      const tops = labelBoxes
        .filter((box) => x >= box.x - 3 && x <= box.x + box.w + 3)
        .map((box) => box.y);
      return Math.min(own, ...tops) - 4;
    };
    const noteLeft = (staple: Staple) => {
      const mid = (staple.xa + staple.xb) / 2;
      return Math.min(Math.max(0, mid - staple.w / 2), Math.max(0, plot.clientWidth - staple.w));
    };
    for (const staple of staples) {
      const left = noteLeft(staple);
      const from = Math.min(staple.xa, left) - 6;
      const to = Math.max(staple.xb, left + staple.w) + 6;
      let level = 0;
      while (spans.some((span) => span.level === level && span.from < to && from < span.to)) level += 1;
      staple.level = level;
      spans.push({ level, from, to });
    }
    const levels = Math.max(...staples.map((s) => s.level)) + 1;
    const heights = Array.from({ length: levels }, (_, level) =>
      Math.max(...staples.filter((s) => s.level === level).map((s) => s.h), 0) + 14,
    );
    for (const staple of staples) {
      const lift = heights.slice(0, staple.level).reduce((sum, value) => sum + value, 0);
      const barY = base - lift;
      const left = noteLeft(staple);
      const top = barY - 3 - staple.h;
      extraTop = Math.max(extraTop, -top + 6);
      const endA = Math.max(barY + 6, legEnd(staple.xa, staple.ta));
      const endB = Math.max(barY + 6, legEnd(staple.xb, staple.tb));
      items.push({
        key: staple.range.key,
        left,
        top,
        path: `M ${staple.xa} ${endA} V ${barY} H ${staple.xb} V ${endB}`,
      });
    }
  }
  return { items, extraTop: Math.ceil(extraTop) };
}
