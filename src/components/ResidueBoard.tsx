import { Fragment, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AminoAcidCard } from "./AminoAcidCard.tsx";
import { playSound } from "../audio/sound.ts";
import { residueLabel } from "../game/labels.ts";
import { trayCards } from "../game/tray.ts";
import type { AminoAcid } from "../game/types.ts";

type Selection = { kind: "slot"; index: number } | { kind: "acid"; key: string; code: string };
type Origin =
  | { kind: "slot"; index: number; code: string | null }
  | { kind: "acid"; key: string; code: string };
type DropTarget = { kind: "slot"; index: number } | { kind: "acid"; key: string; code: string };
type DragView = {
  code: string;
  x: number;
  y: number;
  over: DropTarget | null;
  slotIndex: number | null;
  acidKey: string | null;
};
type Gesture = {
  pointerId: number;
  x: number;
  y: number;
  origin: Origin;
  timer: number;
  dragging: boolean;
  longPressed: boolean;
  moved: boolean;
};

type Props = {
  acids: readonly AminoAcid[];
  deal: readonly string[];
  initialCodes: readonly string[];
  initialSlotCount: number;
  maxSlots: number;
  hydrogen: boolean;
  hydroxyl: boolean;
  onHydrogen?: () => void;
  onHydroxyl?: () => void;
  /** ペプチドの横にゴミ箱を置く。2回続けて押すと、入れたアミノ酸をすべて消す。 */
  clearable?: boolean;
  onCodesChange: (codes: string[]) => void;
};

const HOLD_MS = 500;
const DRAG_PX = 8;
const WAVY_CIRCLE = wavyCircle();

export function ResidueBoard({
  acids,
  deal,
  initialCodes,
  initialSlotCount,
  maxSlots,
  hydrogen,
  hydroxyl,
  onHydrogen,
  onHydroxyl,
  clearable = false,
  onCodesChange,
}: Props) {
  const dealKey = deal.join("|");
  const cards = useMemo(() => {
    const codes = dealKey ? dealKey.split("|") : [];
    return trayCards(codes, acids);
  }, [acids, dealKey]);
  const [slots, setSlots] = useState<(string | null)[]>(() =>
    createSlots(initialCodes, initialSlotCount, maxSlots),
  );
  const [selection, setSelection] = useState<Selection | null>(null);
  const [prompt, setPrompt] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragView | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLButtonElement>(null);
  const [trashArmed, setTrashArmed] = useState(false);
  const slotsRef = useRef(slots);
  const gesture = useRef<Gesture | null>(null);
  const ignoreClick = useRef(false);
  const blockMinus = useRef(false);
  slotsRef.current = slots;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      const target = event.target;
      if (!(target instanceof Node) || !root) return;
      const element = target instanceof Element ? target : target.parentElement;
      const kept =
        element !== null &&
        root.contains(element) &&
        element.closest("[data-keep-selection]") !== null;
      if (kept) return;
      setSelection(null);
      setPrompt(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      const current = gesture.current;
      if (current) window.clearTimeout(current.timer);
    };
  }, []);

  // ゴミ箱は1回目で待機し、続けてもう1回押したときだけ消す。ほかを触るか、時間が過ぎたら待機を解く。
  useEffect(() => {
    if (!trashArmed) return;
    const timer = window.setTimeout(() => setTrashArmed(false), 3000);
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && trashRef.current?.contains(target)) return;
      setTrashArmed(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [trashArmed]);

  useEffect(() => {
    if (prompt === null) {
      blockMinus.current = false;
      return;
    }
    blockMinus.current = true;
    function onUp() {
      window.setTimeout(() => {
        blockMinus.current = false;
      }, 0);
    }
    window.addEventListener("pointerup", onUp, true);
    return () => window.removeEventListener("pointerup", onUp, true);
  }, [prompt]);

  function commit(next: (string | null)[]) {
    slotsRef.current = next;
    setSlots(next);
    onCodesChange(next.filter((code): code is string => code !== null));
  }

  function writeAt(index: number, code: string) {
    const next = [...slotsRef.current];
    if (index < 0 || index >= next.length) return;
    next[index] = next[index] === code ? null : code;
    // 枠にアミノ酸が入ったとき（同じアミノ酸を合わせて空にしたときは鳴らさない）。
    if (next[index] !== null) playSound("fill");
    commit(next);
  }

  function applyDrop(source: Origin, over: DropTarget | null) {
    if (!over || !source.code) return;
    if (source.kind === "slot" && over.kind === "slot") {
      if (source.index === over.index) return;
      const next = [...slotsRef.current];
      const from = next[source.index] ?? null;
      const to = next[over.index] ?? null;
      next[source.index] = to;
      next[over.index] = from;
      playSound("fill");
      commit(next);
      return;
    }
    if (source.kind === "acid" && over.kind === "slot") {
      writeAt(over.index, source.code);
      return;
    }
    if (source.kind === "slot" && over.kind === "acid") {
      writeAt(source.index, over.code);
    }
  }

  function dropTargetAt(x: number, y: number): DropTarget | null {
    const root = rootRef.current;
    if (!root) return null;
    for (const element of document.elementsFromPoint(x, y)) {
      if (!(element instanceof Element) || !root.contains(element)) continue;
      const slot = element.closest("[data-slot-index]");
      if (slot instanceof HTMLElement && slot.dataset.slotIndex) {
        return { kind: "slot", index: Number(slot.dataset.slotIndex) };
      }
      const acid = element.closest("[data-acid-key]");
      if (acid instanceof HTMLElement && acid.dataset.acidKey && acid.dataset.acidCode) {
        return { kind: "acid", key: acid.dataset.acidKey, code: acid.dataset.acidCode };
      }
    }
    return null;
  }

  function stopGesture(current: Gesture) {
    window.clearTimeout(current.timer);
    window.removeEventListener("pointermove", onGestureMove);
    window.removeEventListener("pointerup", onGestureEnd);
    window.removeEventListener("pointercancel", onGestureEnd);
    if (gesture.current === current) gesture.current = null;
  }

  function onGestureMove(event: PointerEvent) {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointerId || current.longPressed) return;
    const distance = Math.hypot(event.clientX - current.x, event.clientY - current.y);
    if (!current.dragging && distance < DRAG_PX) return;
    window.clearTimeout(current.timer);
    if (!current.origin.code) {
      current.moved = true;
      return;
    }
    current.dragging = true;
    setDrag({
      code: current.origin.code,
      x: event.clientX,
      y: event.clientY,
      over: dropTargetAt(event.clientX, event.clientY),
      slotIndex: current.origin.kind === "slot" ? current.origin.index : null,
      acidKey: current.origin.kind === "acid" ? current.origin.key : null,
    });
  }

  function onGestureEnd(event: PointerEvent) {
    const current = gesture.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const dragging = current.dragging;
    const moved = current.moved;
    const longPressed = current.longPressed;
    const origin = current.origin;
    stopGesture(current);
    if (dragging && origin.code) {
      ignoreClick.current = true;
      applyDrop(origin, dropTargetAt(event.clientX, event.clientY));
      setDrag(null);
      window.setTimeout(() => {
        ignoreClick.current = false;
      }, 0);
      return;
    }
    setDrag(null);
    if (longPressed || moved) {
      ignoreClick.current = true;
      window.setTimeout(() => {
        ignoreClick.current = false;
      }, 0);
    }
  }

  function beginGesture(event: ReactPointerEvent, origin: Origin) {
    if (event.button !== 0) return;
    if (gesture.current) stopGesture(gesture.current);
    const point: Gesture = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      origin,
      timer: 0,
      dragging: false,
      longPressed: false,
      moved: false,
    };
    if (origin.kind === "slot") {
      point.timer = window.setTimeout(() => {
        if (gesture.current !== point || point.dragging) return;
        point.longPressed = true;
        setPrompt(origin.index);
      }, HOLD_MS);
    }
    gesture.current = point;
    window.addEventListener("pointermove", onGestureMove);
    window.addEventListener("pointerup", onGestureEnd);
    window.addEventListener("pointercancel", onGestureEnd);
  }

  function onBoardPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const slot = target.closest("[data-slot-index]");
    if (slot instanceof HTMLElement && slot.dataset.slotIndex) {
      const index = Number(slot.dataset.slotIndex);
      beginGesture(event, { kind: "slot", index, code: slotsRef.current[index] ?? null });
      return;
    }
    const acid = target.closest("[data-acid-key]");
    if (acid instanceof HTMLElement && acid.dataset.acidKey && acid.dataset.acidCode) {
      beginGesture(event, {
        kind: "acid",
        key: acid.dataset.acidKey,
        code: acid.dataset.acidCode,
      });
    }
  }

  function onSlotClick(index: number) {
    if (ignoreClick.current) return;
    setPrompt(null);
    if (selection?.kind === "acid") {
      writeAt(index, selection.code);
      return;
    }
    if (selection?.kind === "slot" && selection.index === index) {
      setSelection(null);
      return;
    }
    setSelection({ kind: "slot", index });
  }

  function onAcidClick(key: string, code: string) {
    if (ignoreClick.current) return;
    setPrompt(null);
    if (selection?.kind === "acid" && selection.key === key) {
      setSelection(null);
      return;
    }
    if (selection?.kind === "slot") {
      writeAt(selection.index, code);
      return;
    }
    setSelection({ kind: "acid", key, code });
  }

  function addLeft() {
    if (slots.length >= maxSlots) return;
    setPrompt(null);
    setSelection((current) =>
      current?.kind === "slot" ? { kind: "slot", index: current.index + 1 } : current,
    );
    commit([null, ...slots]);
  }

  function addRight() {
    if (slots.length >= maxSlots) return;
    setPrompt(null);
    commit([...slots, null]);
  }

  function removeSlot(index: number) {
    if (blockMinus.current) return;
    setPrompt(null);
    setSelection((current) => {
      if (current?.kind !== "slot") return current;
      if (current.index === index) return null;
      if (current.index > index) return { kind: "slot", index: current.index - 1 };
      return current;
    });
    commit(slots.filter((_, item) => item !== index));
  }

  const hasCodes = slots.some((code) => code !== null);

  function onTrash() {
    if (!hasCodes) return;
    setPrompt(null);
    if (!trashArmed) {
      setTrashArmed(true);
      return;
    }
    setTrashArmed(false);
    setSelection(null);
    commit(slots.map(() => null));
  }

  const highlighted = selection?.kind === "slot" ? selection.index : null;
  const full = slots.length >= maxSlots;

  return (
    <div className="residue-board" ref={rootRef} onPointerDown={onBoardPointerDown}>
      <div className="peptide-chain">
        <AddButton label="左に枠を足す" side="left" disabled={full} onClick={addLeft} />
        <Cap label="H" active={hydrogen} onClick={onHydrogen} />
        {slots.map((code, index) => (
          <Fragment key={`slot-${index}`}>
            <Join flush={highlighted === index || highlighted === index - 1} />
            <Slot
              code={code}
              index={index}
              acids={acids}
              selected={selection?.kind === "slot" && selection.index === index}
              dropOver={drag?.over?.kind === "slot" && drag.over.index === index}
              dragging={drag?.slotIndex === index}
              prompt={prompt === index}
              onClick={() => onSlotClick(index)}
              onRemove={() => removeSlot(index)}
            />
          </Fragment>
        ))}
        <Join flush={slots.length > 0 && highlighted === slots.length - 1} />
        <Cap label="OH" active={hydroxyl} oh onClick={onHydroxyl} />
        <AddButton label="右に枠を足す" side="right" disabled={full} onClick={addRight} />
        {clearable ? (
          <button
            ref={trashRef}
            type="button"
            className={trashArmed ? "slot-trash is-armed" : "slot-trash"}
            aria-disabled={!hasCodes}
            aria-label={
              trashArmed
                ? "もう一度押すと、入れたアミノ酸をすべて消します"
                : "入れたアミノ酸をすべて消す（2回続けて押します）"
            }
            onClick={onTrash}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10 11v5.5M14 11v5.5" />
            </svg>
            {trashArmed ? <span className="slot-trash-hint">もう一度</span> : null}
          </button>
        ) : null}
      </div>
      <div className="tray" aria-label="使えるカード">
        {cards.map((card) => {
          return (
            <AminoAcidCard
              key={card.key}
              acid={card.acid}
              acidKey={card.key}
              pressed={selection?.kind === "acid" && selection.key === card.key}
              dropOver={drag?.over?.kind === "acid" && drag.over.key === card.key}
              dragging={drag?.acidKey === card.key}
              keepSelection
              onClick={() => onAcidClick(card.key, card.code)}
            />
          );
        })}
      </div>
      {drag ? (
        <span
          className="bead drag-ghost"
          data-code={drag.code}
          data-drag-ghost=""
          style={{ left: drag.x, top: drag.y }}
          aria-hidden="true"
        >
          {drag.code}
        </span>
      ) : null}
    </div>
  );
}

function Slot({
  code,
  index,
  acids,
  selected,
  dropOver,
  dragging,
  prompt,
  onClick,
  onRemove,
}: {
  code: string | null;
  index: number;
  acids: readonly AminoAcid[];
  selected: boolean;
  dropOver: boolean;
  dragging: boolean;
  prompt: boolean;
  onClick: () => void;
  onRemove: () => void;
}) {
  const className = [
    "bead",
    code ? "" : "is-empty",
    selected ? "is-selected" : "",
    dropOver ? "is-drop" : "",
    dragging ? "is-dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className="bead-unit" data-keep-selection="">
      <button
        type="button"
        className={className}
        data-code={code ?? undefined}
        data-slot-index={index}
        data-keep-selection=""
        aria-pressed={selected}
        aria-label={code ? residueLabel(code, acids) : "空の枠"}
        onClick={onClick}
        onContextMenu={(event) => event.preventDefault()}
      >
        {code ?? ""}
      </button>
      {prompt ? (
        <span className="remove-bubble" data-keep-selection="">
          <button type="button" aria-label="この枠を消す" data-keep-selection="" onClick={onRemove}>
            −
          </button>
        </span>
      ) : null}
    </span>
  );
}

function Join({ flush }: { flush: boolean }) {
  return (
    <span className={flush ? "bead-join is-flush" : "bead-join"}>
      <span className="bead-bond" aria-hidden="true" />
    </span>
  );
}

function Cap({
  label,
  active,
  oh = false,
  onClick,
}: {
  label: string;
  active: boolean;
  oh?: boolean;
  onClick?: () => void;
}) {
  const className = `bead is-cap${oh ? " is-oh" : ""}${active ? "" : " is-off"}`;
  return (
    <span className="bead-cap">
      {onClick ? (
        <button type="button" className={className} aria-pressed={active} onClick={onClick}>
          {label}
        </button>
      ) : (
        <span className={className}>{label}</span>
      )}
    </span>
  );
}

function AddButton({
  label,
  side,
  disabled,
  onClick,
}: {
  label: string;
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`slot-add is-${side}`}
      data-keep-selection=""
      aria-disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d={WAVY_CIRCLE} />
        <path d="M20 13.5v13M13.5 20h13" />
      </svg>
    </button>
  );
}

function createSlots(
  codes: readonly string[],
  count: number,
  maxSlots: number,
): (string | null)[] {
  const limit = Math.min(maxSlots, Math.max(0, count, codes.length));
  const slots: (string | null)[] = Array.from({ length: limit }, () => null);
  codes.forEach((code, index) => {
    if (index < slots.length) slots[index] = code;
  });
  return slots;
}

function wavyCircle() {
  const cx = 20;
  const cy = 20;
  const radius = 12.2;
  const amplitude = 1.25;
  const waves = 8;
  const steps = 96;
  let path = "";
  for (let step = 0; step <= steps; step += 1) {
    const angle = (step / steps) * Math.PI * 2;
    const distance = radius + Math.sin(angle * waves) * amplitude;
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance;
    path += `${step === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${path}Z`;
}
