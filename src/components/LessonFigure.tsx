import { useLayoutEffect, useRef, useState } from "react";
import instrumentUrl from "../assets/instrument.png";
import { aminoAcids } from "../data/aminoAcids.ts";
import { buildPeptide } from "../game/fragments.ts";
import type { LessonFigureKind } from "../game/types.ts";
import { PeakSpectrum } from "./PeakSpectrum.tsx";

const example = buildPeptide("GAS", aminoAcids);

export function LessonPage({ figure }: { figure: LessonFigureKind }) {
  if (figure === "goal") {
    return (
      <figure className="lesson-figure">
        <div className="guess-flow">
          <div className="figure-chain" aria-label="まだ分からないペプチド">
            <Cap label="H" />
            <Unknown />
            <Unknown />
            <Unknown />
            <Cap label="OH" />
          </div>
          <FlowArrow />
          <div className="solved-peptide">
            <div className="figure-chain" aria-label="グリシン、アラニン、セリン">
              <Cap label="H" />
              <Residue code="G" />
              <Residue code="A" />
              <Residue code="S" />
              <Cap label="OH" />
            </div>
            <IdeaBulb />
          </div>
        </div>
      </figure>
    );
  }

  if (figure === "measure") {
    const intact = example.peaks.filter((peak) => peak.id === "intact");
    return (
      <figure className="lesson-figure">
        <div className="measure-flow">
          <div className="figure-chain">
            <Cap label="H" />
            <Residue code="G" mass={57} />
            <Residue code="A" mass={71} />
            <Residue code="S" mass={87} />
            <Cap label="OH" />
            <span className="figure-eq">+19</span>
            <span className="figure-eq">=234</span>
          </div>
          <FlowArrow />
          <Instrument />
          <FlowArrow />
          <PeakSpectrum peaks={intact} guidePeakId="intact" readOnly compact />
        </div>
      </figure>
    );
  }

  if (figure === "cut") {
    return (
      <figure className="lesson-figure">
        <div className="measure-flow">
          <div className="figure-chain">
            <Cap label="H" />
            <Residue code="G" />
            <Residue code="A" />
            <Residue code="S" />
            <Cap label="OH" />
          </div>
          <FlowArrow />
          <div className="cut-step">
            <Instrument />
            <span className="figure-cut">ここで分かれる</span>
          </div>
          <FlowArrow />
          <div className="figure-pieces">
            <FragmentPiece piece={gasPieces[0]} />
            <FragmentPiece piece={gasPieces[3]} />
          </div>
          <FlowArrow />
          <PeakSpectrum
            peaks={example.peaks}
            guidePeakIds={["left-1", "right-2"]}
            readOnly
            compact
          />
        </div>
      </figure>
    );
  }

  return (
    <figure className="lesson-figure">
      <ManyPeaks />
    </figure>
  );
}

const gasPieces: readonly Piece[] = [
  {
    peakId: "left-1",
    plus: 1,
    hydrogen: true,
    residues: [{ code: "G", mass: 57 }],
    mass: 58,
  },
  {
    peakId: "right-1",
    plus: 19,
    hydroxyl: true,
    residues: [{ code: "S", mass: 87 }],
    mass: 106,
  },
  {
    peakId: "left-2",
    plus: 1,
    hydrogen: true,
    residues: [
      { code: "G", mass: 57 },
      { code: "A", mass: 71 },
    ],
    mass: 129,
  },
  {
    peakId: "right-2",
    plus: 19,
    hydroxyl: true,
    residues: [
      { code: "A", mass: 71 },
      { code: "S", mass: 87 },
    ],
    mass: 177,
  },
  {
    peakId: "intact",
    plus: 19,
    hydrogen: true,
    hydroxyl: true,
    residues: [
      { code: "G", mass: 57 },
      { code: "A", mass: 71 },
      { code: "S", mass: 87 },
    ],
    mass: 234,
  },
];

type Piece = {
  peakId: string;
  plus: 1 | 19;
  hydrogen?: boolean;
  hydroxyl?: boolean;
  residues: readonly { code: string; mass: number }[];
  mass: number;
};

function FragmentPiece({ piece }: { piece: Piece }) {
  return (
    <div className="figure-piece" data-peak={piece.peakId}>
      <span className={piece.plus === 1 ? "figure-mass is-exception" : "figure-mass"}>
        +{piece.plus}
      </span>
      <div className="figure-chain">
        {piece.hydrogen ? <Cap label="H" /> : null}
        {piece.residues.map((residue) => (
          <Residue key={`${residue.code}-${residue.mass}`} code={residue.code} mass={residue.mass} />
        ))}
        {piece.hydroxyl ? <Cap label="OH" /> : null}
      </div>
      <span className="figure-result">質量 {piece.mass}</span>
    </div>
  );
}

type Arrow = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function ManyPeaks() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const place = () => {
      const rootRect = root.getBoundingClientRect();
      const next = [...root.querySelectorAll<HTMLElement>(".figure-piece")].flatMap((piece) => {
        const number = root.querySelector<HTMLElement>(
          `.peak-mass[data-id="${piece.dataset.peak}"] .peak-value`,
        );
        const label = number?.closest<HTMLElement>(".peak-mass");
        if (!number || !label || getComputedStyle(label).visibility === "hidden") return [];
        const pieceRect = piece.getBoundingClientRect();
        const numberRect = number.getBoundingClientRect();
        return [
          {
            id: piece.dataset.peak ?? "",
            x1: Math.round(pieceRect.left + pieceRect.width / 2 - rootRect.left),
            y1: Math.round(pieceRect.bottom - rootRect.top),
            x2: Math.round(numberRect.left + numberRect.width / 2 - rootRect.left),
            y2: Math.round(numberRect.top - rootRect.top),
          },
        ];
      });
      setArrows((current) => (sameArrows(current, next) ? current : next));
    };

    place();
    const frame = requestAnimationFrame(place);
    const observer = new ResizeObserver(place);
    observer.observe(root);
    const plot = root.querySelector(".spectrum-plot");
    const mutations = new MutationObserver(place);
    if (plot) mutations.observe(plot, { attributes: true, subtree: true, attributeFilter: ["style"] });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return (
    <div className="peak-map" ref={rootRef}>
      <div className="peak-map-row">
        {gasPieces.map((piece) => (
          <FragmentPiece key={piece.peakId} piece={piece} />
        ))}
      </div>
      <PeakSpectrum peaks={example.peaks} readOnly compact />
      <svg className="peak-map-arrows" aria-hidden="true">
        <defs>
          <marker
            id="peak-map-head"
            markerWidth="8"
            markerHeight="8"
            refX="8"
            refY="4"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 Z" fill="#1d2430" />
          </marker>
        </defs>
        {arrows.map((arrow) => (
          <line
            key={arrow.id}
            x1={arrow.x1}
            y1={arrow.y1}
            x2={arrow.x2}
            y2={arrow.y2}
            stroke="#1d2430"
            strokeWidth="1.5"
            markerEnd="url(#peak-map-head)"
          />
        ))}
      </svg>
    </div>
  );
}

function sameArrows(current: readonly Arrow[], next: readonly Arrow[]): boolean {
  if (current.length !== next.length) return false;
  return current.every(
    (arrow, index) =>
      arrow.id === next[index]?.id &&
      arrow.x1 === next[index]?.x1 &&
      arrow.y1 === next[index]?.y1 &&
      arrow.x2 === next[index]?.x2 &&
      arrow.y2 === next[index]?.y2,
  );
}

function Instrument() {
  return <img className="instrument-shot" src={instrumentUrl} alt="質量分析計" />;
}

function FlowArrow() {
  return <span className="flow-arrow" aria-hidden="true" />;
}

function Unknown() {
  return <span className="bead is-unknown">?</span>;
}

function IdeaBulb() {
  return (
    <span className="idea-bulb" aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <path
          d="M16.5 7.2 18.4 10M24 5.2v3.2M31.5 7.2 29.6 10"
          fill="none"
          stroke="#1d2430"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M24 12.2a8.4 8.4 0 0 0-5.2 15c.9.8 1.5 1.7 1.5 2.8v.8h7.4v-.8c0-1.1.6-2 1.5-2.8a8.4 8.4 0 0 0-5.2-15z"
          fill="#f6d56b"
          stroke="#1d2430"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M24 20.2v4.2" fill="none" stroke="#1d2430" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M20.4 34.2h7.2M21.2 37h5.6M22.2 39.6h3.6"
          fill="none"
          stroke="#1d2430"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function Residue({ code, mass }: { code: string; mass?: number }) {
  return (
    <span className="figure-residue">
      <span className="bead" data-code={code}>
        {code}
      </span>
      {mass !== undefined ? <span className="figure-residue-mass">{mass}</span> : null}
    </span>
  );
}

function Cap({ label }: { label: "H" | "OH" }) {
  return (
    <span className="figure-cap">
      <span className={label === "OH" ? "bead is-cap is-oh" : "bead is-cap"}>{label}</span>
    </span>
  );
}
