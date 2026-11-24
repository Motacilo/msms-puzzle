type Props = {
  verdict: "correct" | "incorrect";
};

/** スペクトルに重ねる大きな文字。正解は CLEAR!、不正解は MISS!。 */
export function VerdictStamp({ verdict }: Props) {
  return verdict === "correct" ? <ClearStamp /> : <MissStamp />;
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

function MissStamp() {
  return (
    <span className="miss-stamp" aria-hidden="true">
      <svg viewBox="0 0 640 230">
        <defs>
          <linearGradient id="miss-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe3df" />
            <stop offset="0.42" stopColor="#ff9a90" />
            <stop offset="0.58" stopColor="#ee5a4f" />
            <stop offset="1" stopColor="#c42a22" />
          </linearGradient>
        </defs>
        <g className="miss-word">
          <text className="miss-layer is-shadow" x="320" y="176" textLength="470" lengthAdjust="spacingAndGlyphs">
            MISS!
          </text>
          <text className="miss-layer is-outer" x="320" y="166" textLength="470" lengthAdjust="spacingAndGlyphs">
            MISS!
          </text>
          <text className="miss-layer is-mid" x="320" y="166" textLength="470" lengthAdjust="spacingAndGlyphs">
            MISS!
          </text>
          <text
            className="miss-layer is-fill"
            x="320"
            y="166"
            textLength="470"
            lengthAdjust="spacingAndGlyphs"
            fill="url(#miss-fill)"
          >
            MISS!
          </text>
        </g>
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
