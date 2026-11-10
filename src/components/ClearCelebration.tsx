import { useEffect, useMemo, useState } from "react";
import { buildPeptide, selectPeaks } from "../game/fragments.ts";
import type { AminoAcid, Peak, Problem } from "../game/types.ts";
import { PeakSpectrum } from "./PeakSpectrum.tsx";
import { PeptideChain } from "./PeptideChain.tsx";

type Props = {
  problem: Problem;
  acids: readonly AminoAcid[];
};

/** 1つ進むまでの時間（ミリ秒）。 */
const STEP_MS = 430;

/**
 * 正解の演出。ピークが順に光り、並べる問題では配列が1つずつ組み上がる。
 * 最後に、スペクトルに重ねて CLEAR! を出す。図を押すと最後まで飛ばせる。
 */
export function ClearCelebration({ problem, acids }: Props) {
  const peaks = useMemo(
    () => selectPeaks(buildPeptide(problem.sequence, acids).peaks, problem.shownPeakIds),
    [problem, acids],
  );
  const steps = useMemo(() => lightSteps(problem, peaks), [problem, peaks]);
  const total = steps.length;
  const still = useMemo(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const [step, setStep] = useState(still ? total : 0);
  const [stamped, setStamped] = useState(still);

  useEffect(() => {
    if (stamped) return;
    if (step >= total) {
      const timer = window.setTimeout(() => setStamped(true), 380);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setStep((current) => current + 1), step === 0 ? 500 : STEP_MS);
    return () => window.clearTimeout(timer);
  }, [step, total, stamped]);

  function skip() {
    setStep(total);
    setStamped(true);
  }

  const lit = steps.slice(0, step).flat();
  const flash = stamped ? [] : (steps[step - 1] ?? []);
  const residues = problem.type === "sequence-builder" ? [...problem.correctSequence] : null;

  return (
    <div
      className={stamped ? "celebrate is-done" : "celebrate"}
      data-step={step}
      onClick={skip}
    >
      {residues ? (
        <div className="result-peptide celebrate-chain">
          <p className="terminus-note">正解のペプチド</p>
          <PeptideChain
            acids={acids}
            residues={residues.slice(0, step)}
            empties={Math.max(0, residues.length - step)}
            hydrogen
            hydroxyl
          />
        </div>
      ) : null}
      <PeakSpectrum
        peaks={peaks}
        readOnly
        litPeakIds={lit}
        flashPeakIds={flash}
        overlay={stamped ? <ClearStamp /> : null}
      />
    </div>
  );
}

/**
 * 光らせる順番。並べる問題では、左から i 個目の残基を置いたときに、
 * その切れ目でできる左のかけら（i 残基分）と右のかけら（残りの分）を光らせ、最後に切る前を光らせる。
 * 選択式では、質量の小さい順に1本ずつ光らせる。
 */
function lightSteps(problem: Problem, peaks: readonly Peak[]): string[][] {
  if (problem.type !== "sequence-builder") {
    return [...peaks].sort((a, b) => a.mass - b.mass).map((peak) => [peak.id]);
  }
  const length = problem.sequence.length;
  return Array.from({ length }, (_, index) => {
    const count = index + 1;
    return peaks
      .filter(
        (peak) =>
          (peak.side === "left" && peak.depth === count) ||
          (peak.side === "right" && peak.depth === length - count) ||
          (peak.side === "intact" && count === length),
      )
      .map((peak) => peak.id);
  });
}

const SPARKS: readonly { x: number; y: number; size: number; delay: number }[] = [
  { x: 52, y: 58, size: 26, delay: 0 },
  { x: 596, y: 44, size: 32, delay: 0.25 },
  { x: 150, y: 196, size: 18, delay: 0.5 },
  { x: 522, y: 202, size: 22, delay: 0.1 },
  { x: 330, y: 22, size: 16, delay: 0.4 },
  { x: 618, y: 150, size: 14, delay: 0.65 },
  { x: 24, y: 150, size: 14, delay: 0.3 },
];

function ClearStamp() {
  return (
    <span className="clear-stamp" aria-hidden="true">
      <svg viewBox="0 0 640 230">
        <defs>
          <linearGradient id="clear-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffbd1" />
            <stop offset="0.42" stopColor="#ffd83d" />
            <stop offset="0.58" stopColor="#ffb21f" />
            <stop offset="1" stopColor="#ff7a1a" />
          </linearGradient>
        </defs>
        <g className="clear-word">
          <text className="clear-layer is-shadow" x="320" y="176" textLength="540" lengthAdjust="spacingAndGlyphs">
            CLEAR!
          </text>
          <text className="clear-layer is-outer" x="320" y="166" textLength="540" lengthAdjust="spacingAndGlyphs">
            CLEAR!
          </text>
          <text className="clear-layer is-mid" x="320" y="166" textLength="540" lengthAdjust="spacingAndGlyphs">
            CLEAR!
          </text>
          <text
            className="clear-layer is-fill"
            x="320"
            y="166"
            textLength="540"
            lengthAdjust="spacingAndGlyphs"
            fill="url(#clear-fill)"
          >
            CLEAR!
          </text>
        </g>
        {SPARKS.map((spark, index) => (
          <path
            key={index}
            className="clear-spark"
            style={{ animationDelay: `${spark.delay}s`, transformOrigin: `${spark.x}px ${spark.y}px` }}
            d={sparkPath(spark.x, spark.y, spark.size)}
          />
        ))}
      </svg>
    </span>
  );
}

/** 4つの先を持つきらめき。 */
function sparkPath(x: number, y: number, size: number): string {
  const inner = size * 0.22;
  return [
    `M ${x} ${y - size}`,
    `L ${x + inner} ${y - inner}`,
    `L ${x + size} ${y}`,
    `L ${x + inner} ${y + inner}`,
    `L ${x} ${y + size}`,
    `L ${x - inner} ${y + inner}`,
    `L ${x - size} ${y}`,
    `L ${x - inner} ${y - inner}`,
    "Z",
  ].join(" ");
}
