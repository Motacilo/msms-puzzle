import { useEffect, type ReactNode } from "react";

type Props = {
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  /** 電卓のように、ほかの欄を見ながら使う小さめの窓。 */
  compact?: boolean;
};

/** 下から出る窓（広い画面では中央）。外側を押すか Esc で閉じる。 */
export function Modal({ title, titleId, onClose, children, compact = false }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={compact ? "modal is-compact" : "modal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-bar">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
