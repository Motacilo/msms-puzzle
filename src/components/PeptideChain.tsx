import { residueLabel } from "../game/labels.ts";
import type { AminoAcid } from "../game/types.ts";

type Props = {
  acids: readonly AminoAcid[];
  residues: readonly string[];
  hydrogen: boolean;
  hydroxyl: boolean;
  empties?: number;
  /** 読めたペプチドと重なる残基。 */
  observedIndexes?: readonly number[];
  onRemove?: (index: number) => void;
  onMove?: (index: number, delta: number) => void;
  onHydrogen?: () => void;
  onHydroxyl?: () => void;
};

export function PeptideChain({
  acids,
  residues,
  hydrogen,
  hydroxyl,
  empties = 0,
  observedIndexes = [],
  onRemove,
  onMove,
  onHydrogen,
  onHydroxyl,
}: Props) {
  return (
    <div className="peptide-chain">
      <CapBead label="H" active={hydrogen} onClick={onHydrogen} />
      {residues.map((code, index) => (
        <span className="bead-slot" key={`${code}-${index}`}>
          <span className="bead-bond" aria-hidden="true" />
          <span className="bead-unit">
            <ResidueBead
              code={code}
              acids={acids}
              observed={observedIndexes.includes(index)}
              onClick={onRemove ? () => onRemove(index) : undefined}
            />
            {onMove ? (
              <span className="slot-move">
                <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0}>
                  左へ
                </button>
                <button
                  type="button"
                  onClick={() => onMove(index, 1)}
                  disabled={index === residues.length - 1}
                >
                  右へ
                </button>
              </span>
            ) : null}
          </span>
        </span>
      ))}
      {Array.from({ length: empties }, (_, index) => (
        <span className="bead-slot" key={`empty-${index}`}>
          <span className="bead-bond" aria-hidden="true" />
          <span className="bead is-empty" aria-hidden="true" />
        </span>
      ))}
      <span className="bead-bond" aria-hidden="true" />
      <CapBead label="OH" active={hydroxyl} onClick={onHydroxyl} />
    </div>
  );
}

function ResidueBead({
  code,
  acids,
  observed = false,
  onClick,
}: {
  code: string;
  acids: readonly AminoAcid[];
  observed?: boolean;
  onClick?: () => void;
}) {
  const name = residueLabel(code, acids);
  const className = observed ? "bead is-observed" : "bead";
  if (!onClick) {
    return (
      <span className={className} data-code={code}>
        {code}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={className}
      data-code={code}
      aria-label={`${name} を戻す`}
      onClick={onClick}
    >
      {code}
    </button>
  );
}

function CapBead({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  const className = [
    "bead",
    "is-cap",
    label === "OH" ? "is-oh" : "",
    active ? "" : "is-off",
  ]
    .filter(Boolean)
    .join(" ");
  const bead = onClick ? (
    <button type="button" className={className} aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  ) : (
    <span className={className}>{label}</span>
  );
  return <span className="bead-cap">{bead}</span>;
}
