import { Modal } from "./Modal.tsx";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
};

/** 問題ごとの自由メモ。書いた内容は入力のたびに残り、判定には使わない。 */
export function FreeNoteDialog({ value, onChange, onClose }: Props) {
  return (
    <Modal title="自由メモ" titleId="free-note-title" onClose={onClose}>
      <p className="note">この問題のメモです。判定には使いません。書いた内容は、閉じても残ります。</p>
      <textarea
        className="free-note"
        value={value}
        rows={9}
        autoFocus
        placeholder="例: 249 − 134 = 115 → D? / 左は 88 から始まる…"
        aria-label="自由メモ"
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="actions">
        <button type="button" className="secondary" disabled={value.length === 0} onClick={() => onChange("")}>
          全部消す
        </button>
      </div>
    </Modal>
  );
}
