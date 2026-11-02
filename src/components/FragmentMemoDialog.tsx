import { useState } from "react";
import { FragmentLabel } from "./FragmentLabel.tsx";
import { Modal } from "./Modal.tsx";
import { ResidueBoard } from "./ResidueBoard.tsx";
import { fragmentLabel } from "../game/labels.ts";
import type { AminoAcid, FragmentMemo } from "../game/types.ts";

/** 1つのピークに付けられるメモの数。 */
export const MAX_MEMOS_PER_PEAK = 6;

type Props = {
  /** ひとつのピークのメモか、2つのピークの間のメモか。 */
  scope: "peak" | "range";
  title: string;
  acids: readonly AminoAcid[];
  palette: readonly string[];
  /** いま付いているメモ。追加や削除のたびに onChange で返す。 */
  memos: readonly FragmentMemo[];
  onChange: (memos: FragmentMemo[]) => void;
  onClose: () => void;
};

export function FragmentMemoDialog({ scope, title, acids, palette, memos, onChange, onClose }: Props) {
  const [residues, setResidues] = useState<string[]>([]);
  const [hydrogen, setHydrogen] = useState(false);
  const [hydroxyl, setHydroxyl] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [boardKey, setBoardKey] = useState(0);
  const [initial, setInitial] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const memo: FragmentMemo = { residues, hydrogen, hydroxyl };
  const label = fragmentLabel(memo);
  const canSave = residues.length > 0 || hydrogen || hydroxyl;

  function load(next: FragmentMemo | null, index: number | null) {
    setResidues(next?.residues ?? []);
    setInitial(next?.residues ?? []);
    setHydrogen(next?.hydrogen ?? false);
    setHydroxyl(next?.hydroxyl ?? false);
    setEditing(index);
    setNote(null);
    setBoardKey((key) => key + 1);
  }

  function save() {
    if (!canSave) {
      setNote("H、アミノ酸、OH のどれかを置いてから登録してください。");
      return;
    }
    const duplicate = memos.some(
      (item, index) => index !== editing && fragmentLabel(item) === label,
    );
    if (duplicate) {
      setNote("同じメモがすでにあります。");
      return;
    }
    if (editing === null) {
      if (memos.length >= MAX_MEMOS_PER_PEAK) {
        setNote(`メモは1つのピークに${MAX_MEMOS_PER_PEAK}個までです。`);
        return;
      }
      onChange([...memos, memo]);
    } else {
      onChange(memos.map((item, index) => (index === editing ? memo : item)));
    }
    load(null, null);
  }

  function remove(index: number) {
    onChange(memos.filter((_, item) => item !== index));
    if (editing === index) load(null, null);
    else if (editing !== null && editing > index) setEditing(editing - 1);
  }

  return (
    <Modal title={title} titleId="fragment-memo-title" onClose={onClose}>
      <p className="note memo-count">
        {scope === "peak" ? "このピークに付けたメモ" : "この2つのピークの間に付けたメモ"}（{memos.length} /{" "}
        {MAX_MEMOS_PER_PEAK}）。候補が複数あるときは、続けて追加できます。
      </p>
      {memos.length === 0 ? (
        <p className="memo-empty">まだメモはありません。</p>
      ) : (
        <ul className="memo-list">
          {memos.map((item, index) => (
            <li key={index} className={editing === index ? "memo-item is-editing" : "memo-item"}>
              <span className="memo-item-label">
                <FragmentLabel memo={item} />
              </span>
              <button type="button" className="text-button" onClick={() => load(item, index)}>
                編集
              </button>
              <button type="button" className="text-button" onClick={() => remove(index)}>
                消す
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="instruction memo-howto">
        {editing === null ? "新しいメモを作ります。" : `${editing + 1}つ目のメモを編集しています。`}
        {scope === "peak"
          ? "枠とアミノ酸は、どちらを先に押してもその位置に入ります。H と OH は付けるときだけ押します。判定には使いません。"
          : "2つのピークの質量の差から読んだ並びを登録します。枠とアミノ酸は、どちらを先に押してもその位置に入ります。判定には使いません。"}
      </p>
      <ResidueBoard
        key={boardKey}
        acids={acids}
        deal={palette}
        initialCodes={initial}
        initialSlotCount={Math.max(1, initial.length)}
        maxSlots={6}
        hydrogen={hydrogen}
        hydroxyl={hydroxyl}
        clearable
        onHydrogen={scope === "peak" ? () => setHydrogen((current) => !current) : undefined}
        onHydroxyl={scope === "peak" ? () => setHydroxyl((current) => !current) : undefined}
        onCodesChange={setResidues}
      />
      <p className="memo-preview">
        {label ? <FragmentLabel memo={memo} /> : "まだ何も置いていません"}
      </p>
      {note ? (
        <p className="notice" role="status">
          {note}
        </p>
      ) : null}
      <div className="actions">
        <button type="button" className="primary" onClick={save}>
          {editing === null ? "メモに追加" : "この内容に更新"}
        </button>
        {editing !== null ? (
          <button type="button" className="secondary" onClick={() => load(null, null)}>
            編集をやめる
          </button>
        ) : null}
        <button type="button" className="secondary" onClick={() => load(null, editing === null ? null : editing)}>
          並べ直し
        </button>
      </div>
    </Modal>
  );
}
