import { ResidueBoard } from "./ResidueBoard.tsx";
import type { AminoAcid } from "../game/types.ts";

type Props = {
  acids: readonly AminoAcid[];
  length: number;
  deal: readonly string[];
  placed: readonly string[];
  onChange: (placed: string[]) => void;
};

export function SequenceBuilder({ acids, length, deal, placed, onChange }: Props) {
  return (
    <div className="builder">
      <p className="terminus-note">
        左がN末端、右がC末端です。枠とアミノ酸は、どちらを先に押してもその位置に入ります。同じアミノ酸を合わせると、その枠は空になります。枠から枠へは選択だけが移ります。ドラッグでも入れ替えられます。＋で枠を足し、枠を長押しすると消せます。
      </p>
      <ResidueBoard
        acids={acids}
        deal={deal}
        initialCodes={placed}
        initialSlotCount={Math.max(length, placed.length)}
        maxSlots={12}
        hydrogen
        hydroxyl
        onCodesChange={(codes) => {
          if (codes.join("") === placed.join("")) return;
          onChange(codes);
        }}
      />
    </div>
  );
}
