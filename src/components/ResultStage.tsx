import { useEffect, useMemo, useRef, useState } from "react";
import { playSound } from "../audio/sound.ts";
import { answerFragments, matchingPeaks, type AnswerFragment } from "../game/answerFragments.ts";
import { buildPeptide, selectPeaks } from "../game/fragments.ts";
import type { AminoAcid, SequenceBuilderProblem } from "../game/types.ts";
import { PeakSpectrum, spectrumAxisMax } from "./PeakSpectrum.tsx";
import { PeptideChain } from "./PeptideChain.tsx";
import { VerdictStamp } from "./VerdictStamp.tsx";

type Props = {
  problem: SequenceBuilderProblem;
  acids: readonly AminoAcid[];
  /** 回答した並び。L/I と K/Q のカードは、そのまま "L/I" "K/Q" で入る。 */
  answer: readonly string[];
  /** 判定の結果。演出の最後に、この結果の文字と音を出す。 */
  verdict: "correct" | "incorrect";
  /** 演出が終わった（飛ばした場合も含む）とき。 */
  onDone?: () => void;
};

/** 最初のかけらが出るまで、かけらどうしの間隔、飛ぶ時間、最後のかけらのあと判定を出すまで（ミリ秒）。 */
const START_MS = 500;
const GAP_MS = 300;
const FLIGHT_MS = 650;
const END_PAD_MS = 450;

type Point = { x: number; y: number };

/**
 * 結果画面。回答したペプチドを切ってできるかけらを、質量の小さい順に出す。
 * かけらは、ペプチドのその部分から、スペクトル上の質量の位置へ飛んでいく。
 * 見えているピークと質量が合えばそのピークが光り、合わなければかけらは消える。
 * すべて終わったら、判定の結果（CLEAR! か MISS!）と音を出す。図を押すと最後まで飛ばせる。
 */
export function ResultStage({ problem, acids, answer, verdict, onDone }: Props) {
  const answerKey = answer.join("|");
  const peaks = useMemo(
    () => selectPeaks(buildPeptide(problem.sequence, acids).peaks, problem.shownPeakIds),
    [problem, acids],
  );
  const fragments = useMemo(() => answerFragments(answer, acids), [answerKey, acids]);
  const matches = useMemo(
    () => fragments.map((fragment) => matchingPeaks(fragment, peaks).map((peak) => peak.id)),
    [fragments, peaks],
  );
  const axisMax = useMemo(() => spectrumAxisMax(peaks), [peaks]);

  const stageRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animations = useRef<Animation[]>([]);
  const timers = useRef<number[]>([]);
  const sounded = useRef(false);
  const [lit, setLit] = useState<string[]>([]);
  const [flash, setFlash] = useState<string[]>([]);
  const [cut, setCut] = useState<AnswerFragment | null>(null);
  const [done, setDone] = useState(false);

  function stopAll() {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
    for (const animation of animations.current) animation.cancel();
    animations.current = [];
  }

  function finish() {
    stopAll();
    setLit([...new Set(matches.flat())]);
    setFlash([]);
    setCut(null);
    setDone(true);
    settle();
    onDone?.();
    if (!sounded.current) {
      sounded.current = true;
      playSound(verdict);
    }
  }

  function later(action: () => void, ms: number) {
    timers.current.push(window.setTimeout(action, ms));
  }

  /**
   * 置いたかけらどうしが重ならないよう、近い位置のものは上へ積む段（0, 1, 2…）。
   * 質量の小さい順（左から右）に、ぶつからない一番低い段を選ぶ。
   */
  function ranksFor(stage: HTMLElement): number[] {
    const stageLeft = stage.getBoundingClientRect().left;
    const placed: { x: number; rank: number }[] = [];
    return fragments.map((_, index) => {
      const id = matches[index]?.[0];
      const label = id ? stage.querySelector(`.peak-mass[data-id="${id}"]`) : null;
      if (!label) return 0;
      const rect = label.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - stageLeft;
      let rank = 0;
      while (placed.some((item) => item.rank === rank && Math.abs(item.x - x) < 88)) rank += 1;
      placed.push({ x, rank });
      return rank;
    });
  }

  /** 演出を飛ばしたとき。合ったかけらはピークの上に置き、合わなかったものは出さない。 */
  function settle() {
    const stage = stageRef.current;
    if (!stage) return;
    const ranks = ranksFor(stage);
    fragments.forEach((fragment, index) => {
      const pill = pillRefs.current[index];
      const hit = matches[index] ?? [];
      if (!pill) return;
      pill.style.opacity = hit.length > 0 ? "1" : "0";
      if (hit.length > 0) {
        const point = targetPoint(stage, fragment, hit[0], axisMax, ranks[index] ?? 0);
        pill.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%) scale(0.8)`;
      }
    });
  }

  function launch(index: number) {
    const stage = stageRef.current;
    const pill = pillRefs.current[index];
    const fragment = fragments[index];
    if (!stage || !pill || !fragment) return;
    setCut(fragment);
    playSound("whoosh");

    const source = sourcePoint(stage, fragment);
    const hit = matches[index] ?? [];
    const target = targetPoint(stage, fragment, hit[0], axisMax, ranksFor(stage)[index] ?? 0);
    const at = (point: Point, scale: number, turn = 0) =>
      `translate(${point.x}px, ${point.y}px) translate(-50%, -50%) scale(${scale}) rotate(${turn}deg)`;

    animations.current.push(
      pill.animate(
        [
          { transform: at(source, 0.6), opacity: 0 },
          { transform: at(source, 1.12), opacity: 1, offset: 0.16, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
          { transform: at(target, hit.length > 0 ? 0.8 : 0.82), opacity: 1 },
        ],
        { duration: FLIGHT_MS, fill: "forwards" },
      ),
    );

    later(() => {
      if (hit.length > 0) {
        // 合った：ピークの数字の上に残り、そのピークが光る。
        setLit((current) => [...new Set([...current, ...hit])]);
        setFlash(hit);
        playSound("match");
      } else {
        // 合わなかった：その場で消える。
        playSound("vanish");
        animations.current.push(
          pill.animate(
            [
              { transform: at(target, 0.82), opacity: 1 },
              { transform: at({ x: target.x, y: target.y + 18 }, 0.5, 14), opacity: 0 },
            ],
            { duration: 320, fill: "forwards" },
          ),
        );
      }
    }, FLIGHT_MS);
  }

  useEffect(() => {
    if (prefersReducedMotion()) {
      finish();
      return stopAll;
    }
    fragments.forEach((_, index) => later(() => launch(index), START_MS + index * GAP_MS));
    later(finish, START_MS + Math.max(0, fragments.length - 1) * GAP_MS + FLIGHT_MS + END_PAD_MS);
    return stopAll;
  }, [answerKey, problem.id]);

  const cutIndexes = cut ? Array.from({ length: cut.to - cut.from }, (_, offset) => cut.from + offset) : [];
  const missIds = done && verdict === "incorrect" ? peaks.filter((peak) => !lit.includes(peak.id)).map((peak) => peak.id) : [];

  return (
    <div
      ref={stageRef}
      className={done ? "celebrate is-done" : "celebrate"}
      onClick={() => {
        if (!done) finish();
      }}
    >
      <div className="verdict-slot">{done ? <VerdictStamp verdict={verdict} /> : null}</div>
      <div className="result-peptide">
        <p className="terminus-note">あなたの回答</p>
        <PeptideChain acids={acids} residues={answer} hydrogen hydroxyl observedIndexes={cutIndexes} />
      </div>
      <PeakSpectrum
        peaks={peaks}
        readOnly
        litPeakIds={lit}
        flashPeakIds={flash}
        missPeakIds={missIds}
      />
      <div className="fly-layer" aria-hidden="true">
        {fragments.map((fragment, index) => (
          <div
            key={fragment.id}
            className="frag"
            ref={(element) => {
              pillRefs.current[index] = element;
            }}
          >
            <span className="frag-chain">
              {fragment.side !== "right" ? <span className="bead is-cap">H</span> : null}
              {answer.slice(fragment.from, fragment.to).map((code, offset) => (
                <span key={offset} className="bead" data-code={code}>
                  {code}
                </span>
              ))}
              {fragment.side !== "left" ? <span className="bead is-cap is-oh">OH</span> : null}
            </span>
            <span className="frag-mass">{fragment.mass}</span>
          </div>
        ))}
      </div>
      <p className={done ? "skip-hint is-hidden" : "skip-hint"}>タップで飛ばせます</p>
      <p className="sr-only" role="status">
        {done ? (verdict === "correct" ? "正解です" : "不正解です") : ""}
      </p>
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function unionCenter(stage: HTMLElement, parts: readonly Element[]): Point {
  const stageRect = stage.getBoundingClientRect();
  const rects = parts.map((part) => part.getBoundingClientRect());
  if (rects.length === 0) return { x: stageRect.width / 2, y: 40 };
  const left = Math.min(...rects.map((rect) => rect.left));
  const right = Math.max(...rects.map((rect) => rect.right));
  const top = Math.min(...rects.map((rect) => rect.top));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return { x: (left + right) / 2 - stageRect.left, y: (top + bottom) / 2 - stageRect.top };
}

/** ペプチドの中で、このかけらにあたる部分（残基と、その側の H か OH）の中心。 */
function sourcePoint(stage: HTMLElement, fragment: AnswerFragment): Point {
  const caps = [...stage.querySelectorAll(".result-peptide .bead-cap")];
  const slots = [...stage.querySelectorAll(".result-peptide .bead-slot")];
  const parts = slots.slice(fragment.from, fragment.to);
  const first = caps[0];
  const last = caps[caps.length - 1];
  if (fragment.side !== "right" && first) parts.push(first);
  if (fragment.side !== "left" && last) parts.push(last);
  return unionCenter(stage, parts);
}

/**
 * かけらの行き先。質量の位置の真上で、合うピークがあればその先端のすぐ上、なければ図の中ほど。
 * 図の右端より重いときは、右端で止める。
 */
function targetPoint(
  stage: HTMLElement,
  fragment: AnswerFragment,
  peakId: string | undefined,
  axisMax: number,
  rank = 0,
): Point {
  const stageRect = stage.getBoundingClientRect();
  const plot = stage.querySelector(".spectrum-plot");
  if (!plot) return { x: stageRect.width / 2, y: stageRect.height / 2 };
  const plotRect = plot.getBoundingClientRect();
  const ratio = Math.min(Math.max(fragment.mass / axisMax, 0), 1);
  const x = plotRect.left - stageRect.left + ratio * plotRect.width;
  // 合うピークがあるときは、そのピークの数字のすぐ上。同じピークに複数合うときは、上へ積む。
  const label = peakId ? stage.querySelector(`.peak-mass[data-id="${peakId}"]`) : null;
  if (label) {
    const labelRect = label.getBoundingClientRect();
    const centerX = labelRect.left + labelRect.width / 2;
    // 近くのピークの数字にも重ならないよう、近所でいちばん高い数字の上に置く。
    let top = labelRect.top;
    for (const near of stage.querySelectorAll(".peak-mass")) {
      const rect = near.getBoundingClientRect();
      if (Math.abs(rect.left + rect.width / 2 - centerX) < 60) top = Math.min(top, rect.top);
    }
    return {
      x: centerX - stageRect.left,
      y: top - stageRect.top - 30 - rank * 54,
    };
  }
  return { x, y: plotRect.top - stageRect.top + plotRect.height * 0.42 };
}
