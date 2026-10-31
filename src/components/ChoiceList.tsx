import { AminoAcidCard } from "./AminoAcidCard.tsx";
import { acidByCode } from "../game/labels.ts";
import { CANNOT_BUILD_LABEL } from "../game/types.ts";
import type { AminoAcid, Choice } from "../game/types.ts";

type SingleProps = {
  multiple?: false;
  acids: readonly AminoAcid[];
  choices: readonly Choice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

type MultipleProps = {
  multiple: true;
  acids: readonly AminoAcid[];
  choices: readonly Choice[];
  selectedCodes: readonly string[];
  impossible: boolean;
  onToggle: (code: string) => void;
  onImpossible: () => void;
};

export function ChoiceList(props: SingleProps | MultipleProps) {
  if (props.multiple) {
    return (
      <div className="choice-grid" role="group" aria-label="候補">
        {props.choices.map((choice) => {
          const acid = acidByCode(choice.sequence, props.acids);
          if (!acid) return null;
          return (
            <AminoAcidCard
              key={choice.id}
              acid={acid}
              pressed={props.selectedCodes.includes(acid.code)}
              onClick={() => props.onToggle(acid.code)}
            />
          );
        })}
        <button
          type="button"
          className={props.impossible ? "card is-selected" : "card"}
          aria-pressed={props.impossible}
          onClick={props.onImpossible}
        >
          <span className="card-label">{CANNOT_BUILD_LABEL}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="choice-grid" role="group" aria-label="候補">
      {props.choices.map((choice) => {
        const acid = acidByCode(choice.sequence, props.acids);
        if (!acid) {
          return (
            <button
              key={choice.id}
              type="button"
              className={
                props.selectedId === choice.id ? "card is-phrase is-selected" : "card is-phrase"
              }
              aria-pressed={props.selectedId === choice.id}
              onClick={() => props.onSelect(choice.id)}
            >
              <span className="card-label">{choice.label ?? choice.sequence}</span>
            </button>
          );
        }
        return (
          <AminoAcidCard
            key={choice.id}
            acid={acid}
            pressed={props.selectedId === choice.id}
            onClick={() => props.onSelect(choice.id)}
          />
        );
      })}
    </div>
  );
}
