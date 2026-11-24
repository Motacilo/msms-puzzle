import { playSound, unlockSound } from "./sound.ts";

/**
 * ボタンの音を鳴らさないもの。
 * - アミノ酸のカードと枠は、ボタンとはみなさない。枠が埋まったときの音は、枠の側で鳴らす。
 * - data-se="none" を付けたボタンは、自分で音を決める（回答するボタンは、結果に応じて正解・不正解の音を鳴らす）。
 */
const NO_BUTTON_SOUND = '[data-acid-key], [data-slot-index], [data-se="none"]';

/** 画面のボタン（button と、開閉の summary）を押したときに、決定ボタンの音を鳴らす。外すときの関数を返す。 */
export function installButtonSound(): () => void {
  const onPointerDown = () => unlockSound();
  const onClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = target.closest("button, summary");
    if (!control) return;
    if (control.matches(NO_BUTTON_SOUND)) return;
    if (control.getAttribute("aria-disabled") === "true") return;
    playSound("button");
  };
  // 押した時点の状態で判断するため、画面が更新される前（キャプチャ段階）で受ける。
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("click", onClick, true);
  return () => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("click", onClick, true);
  };
}
