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
      <details className="howto">
        <summary>回答</summary>
        <p className="terminus-note">
          枠とアミノ酸は、どちらを先に押してもその位置に入ります。同じアミノ酸を合わせると、その枠は空になります。枠から枠へは選択だけが移ります。ドラッグでも入れ替えられます。＋で枠を足し、枠を長押しすると消せます。ゴミ箱は2回続けて押すと、入れたアミノ酸をすべて消します。
        </p>
      </details>
      <ResidueBoard
        acids={acids}
        deal={deal}
        initialCodes={placed}
        initialSlotCount={Math.max(length, placed.length)}
        maxSlots={12}
        hydrogen
        hydroxyl
        clearable
        onCodesChange={(codes) => {
          if (codes.join("") === placed.join("")) return;
          onChange(codes);
        }}
      />
      <ul className="aa-legend" aria-label="アミノ酸の色分け">
        <li data-group="hydrophobic">疎水性</li>
        <li data-group="aromatic">芳香族</li>
        <li data-group="acidic">酸性</li>
        <li data-group="basic">塩基性</li>
        <li data-group="polar">そのほかの親水性</li>
      </ul>
    </div>
  );
}
