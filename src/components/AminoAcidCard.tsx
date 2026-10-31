import type { AminoAcid } from "../game/types.ts";

type Props = {
  acid: AminoAcid;
  pressed?: boolean;
  keepSelection?: boolean;
  acidKey?: string;
  dropOver?: boolean;
  dragging?: boolean;
  onClick: () => void;
};

export function AminoAcidCard({
  acid,
  pressed = false,
  keepSelection = false,
  acidKey,
  dropOver = false,
  dragging = false,
  onClick,
}: Props) {
  const className = [
    "card",
    pressed ? "is-selected" : "",
    dropOver ? "is-drop" : "",
    dragging ? "is-dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={className}
      aria-pressed={pressed}
      data-keep-selection={keepSelection ? "" : undefined}
      data-acid-key={acidKey}
      data-acid-code={acidKey ? acid.code : undefined}
      onClick={onClick}
    >
      <span className="card-code">
        {acid.code}
        <span className="card-mass">({acid.residueMass})</span>
      </span>
      <span className="card-name">{acid.nameJa}</span>
    </button>
  );
}
