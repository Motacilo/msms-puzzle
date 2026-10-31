import { useEffect, useState } from "react";
import { ResidueBoard } from "./ResidueBoard.tsx";
import { fragmentLabel } from "../game/labels.ts";
import type { AminoAcid, FragmentMemo, Peak } from "../game/types.ts";

type Props = {
  peak: Peak;
  acids: readonly AminoAcid[];
  palette: readonly string[];
  initial: FragmentMemo;
  onSave: (memo: FragmentMemo) => void;
  onClear: () => void;
  onClose: () => void;
};

export function FragmentMemoDialog({
  peak,
  acids,
  palette,
  initial,
  onSave,
  onClear,
  onClose,
}: Props) {
  const [residues, setResidues] = useState<string[]>(initial.residues);
  const [hydrogen, setHydrogen] = useState(initial.hydrogen);
  const [hydroxyl, setHydroxyl] = useState(initial.hydroxyl);
  const [boardKey, setBoardKey] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const memo: FragmentMemo = { residues, hydrogen, hydroxyl };
  const label = fragmentLabel(memo);
  const canSave = residues.length > 0 || hydrogen || hydroxyl;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function reset() {
    setResidues([]);
    setHydrogen(false);
    setHydroxyl(false);
    setNote(null);
    setBoardKey((key) => key + 1);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fragment-memo-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-bar">
          <h2 id="fragment-memo-title">質量 {peak.mass} のメモ</h2>
          <button type="button" className="secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
        <p className="instruction">
          枠とアミノ酸は、どちらを先に押してもその位置に入ります。同じアミノ酸を合わせると空になります。ドラッグでも入れ替えられます。H
          と OH は付けるときだけ押し、枠は外側の＋で足し、長押しの − で消します。判定には使いません。
        </p>
        <ResidueBoard
          key={boardKey}
          acids={acids}
          deal={palette}
          initialCodes={residues}
          initialSlotCount={Math.max(1, residues.length)}
          maxSlots={6}
          hydrogen={hydrogen}
          hydroxyl={hydroxyl}
          onHydrogen={() => setHydrogen((current) => !current)}
          onHydroxyl={() => setHydroxyl((current) => !current)}
          onCodesChange={setResidues}
        />
        <p className="memo-preview">{label || "まだ何も置いていません"}</p>
        {note ? (
          <p className="notice" role="status">
            {note}
          </p>
        ) : null}
        <div className="actions">
          <button
            type="button"
            className="primary"
            onClick={() => {
              if (!canSave) {
                setNote("H、アミノ酸、OH のどれかを置いてから登録してください。");
                return;
              }
              onSave(memo);
            }}
          >
            登録する
          </button>
          <button type="button" className="secondary" onClick={onClear}>
            メモを消す
          </button>
          <button type="button" className="secondary" onClick={reset}>
            並べ直し
          </button>
        </div>
      </div>
    </div>
  );
}
