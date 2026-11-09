import type { Peak } from "../game/types.ts";

type Props = {
  peaks: readonly Peak[];
};

const WIDTH = 120;
const HEIGHT = 60;
const LEFT = 6;
const RIGHT = 6;
const BASE = HEIGHT - 6;
const TOP = 6;

/**
 * ホームのサムネイル用の小さなスペクトル。ピークの位置（質量）と高さだけを描き、数字は出さない。
 * 横軸は、この問題の最大の質量に合わせる。
 */
export function SpectrumThumbnail({ peaks }: Props) {
  const heaviest = Math.max(...peaks.map((peak) => peak.mass), 1);
  const axisMax = heaviest * 1.06;
  const span = WIDTH - LEFT - RIGHT;
  return (
    <svg
      className="spectrum-thumb"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`ピークが${peaks.length}本のスペクトル`}
    >
      <line className="thumb-axis" x1={LEFT} y1={BASE} x2={WIDTH - RIGHT + 2} y2={BASE} />
      {peaks.map((peak) => {
        const x = LEFT + (peak.mass / axisMax) * span;
        const top = BASE - peak.intensity * (BASE - TOP);
        return <line key={peak.id} className="thumb-peak" x1={x} y1={BASE} x2={x} y2={top} />;
      })}
    </svg>
  );
}
