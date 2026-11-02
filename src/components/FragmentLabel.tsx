import { displayCode } from "../game/labels.ts";
import type { FragmentMemo } from "../game/types.ts";

/**
 * 端の H と OH だけを丸で囲む。並びの中の H はヒスチジンのまま。
 * 文字列ではなくメモの構造から描くので、「ヒスチジン-OH」が「H末端 + OH」に化けない。
 */
export function FragmentLabel({ memo }: { memo: FragmentMemo }) {
  return (
    <span className="fragment-label">
      {memo.hydrogen ? (
        <>
          <span className="cap-mark">H</span>
          <span className="fragment-dash">-</span>
        </>
      ) : null}
      {memo.residues.map(displayCode).join("")}
      {memo.hydroxyl ? (
        <>
          <span className="fragment-dash">-</span>
          <span className="cap-mark">OH</span>
        </>
      ) : null}
    </span>
  );
}
