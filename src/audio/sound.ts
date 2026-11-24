import buttonUrl from "../assets/se/決定ボタンを押す3.mp3";
import fillUrl from "../assets/se/決定ボタンを押す44.mp3";
import selectUrl from "../assets/se/決定ボタンを押す48.mp3";
import deleteUrl from "../assets/se/決定ボタンを押す50.mp3";
import correctUrl from "../assets/se/クイズ正解1.mp3";
import incorrectUrl from "../assets/se/クイズ不正解1.mp3";

export type SoundName = "button" | "select" | "fill" | "delete" | "correct" | "incorrect";

/**
 * 効果音の一覧。gain は、4つの音の聞こえる大きさ（LUFS）がそろうように決めた倍率。
 * button -23.5、select -21.9、fill -28.0、correct -14.6、incorrect -20.9 を、おおよそ -20〜-26 に寄せている。
 */
const SOUNDS: Record<SoundName, { url: string; gain: number }> = {
  button: { url: buttonUrl, gain: 1 },
  select: { url: selectUrl, gain: 0.7 },
  fill: { url: fillUrl, gain: 1.3 },
  delete: { url: deleteUrl, gain: 2.2 },
  correct: { url: correctUrl, gain: 0.55 },
  incorrect: { url: incorrectUrl, gain: 1 },
};

/** 全体の音量。 */
const MASTER_GAIN = 0.8;

/** 読み込みが遅れたときに、あとから鳴らすのをやめるまでの時間（ミリ秒）。 */
const STALE_MS = 600;

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
type Playing = { source: AudioBufferSourceNode; gain: GainNode };

let context: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
const loading = new Map<SoundName, Promise<AudioBuffer | null>>();
const playing = new Map<SoundName, Playing>();

function getContext(): AudioContext | null {
  if (context) return context;
  if (typeof window === "undefined") return null;
  try {
    const Context = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
    if (!Context) return null;
    context = new Context();
  } catch {
    context = null;
  }
  return context;
}

function load(name: SoundName): Promise<AudioBuffer | null> {
  const cached = loading.get(name);
  if (cached) return cached;
  const ctx = getContext();
  if (!ctx) return Promise.resolve(null);
  const task = fetch(SOUNDS[name].url)
    .then((response) => {
      if (!response.ok) throw new Error(`status ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      buffers.set(name, buffer);
      return buffer;
    })
    .catch(() => {
      // 失敗は音が出ないだけにする。次に鳴らすときにもう一度読む。
      loading.delete(name);
      return null;
    });
  loading.set(name, task);
  return task;
}

/**
 * 最初に画面を触ったときに呼ぶ。ブラウザの制限を解いて、4つの音をあらかじめ読み込む。
 * 読み込みを先に済ませておくと、最初の1回から遅れずに鳴る。
 */
export function unlockSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  for (const name of Object.keys(SOUNDS) as SoundName[]) void load(name);
}

function start(ctx: AudioContext, buffer: AudioBuffer, name: SoundName): void {
  try {
    // 同じ音が続けて鳴るときは、前の音を短く消してから鳴らす（音が重なって濁らないように）。
    const previous = playing.get(name);
    if (previous) {
      previous.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.012);
      previous.source.stop(ctx.currentTime + 0.06);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = SOUNDS[name].gain * MASTER_GAIN;
    source.connect(gain);
    gain.connect(ctx.destination);
    const entry: Playing = { source, gain };
    playing.set(name, entry);
    source.onended = () => {
      if (playing.get(name) === entry) playing.delete(name);
    };
    source.start();
  } catch {
    // 音が出ないだけで、ゲームは止めない。
  }
}

export function playSound(name: SoundName): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  const buffer = buffers.get(name);
  if (buffer) {
    start(ctx, buffer, name);
    return;
  }
  const requested = performance.now();
  void load(name).then((loaded) => {
    if (loaded && performance.now() - requested < STALE_MS) start(ctx, loaded, name);
  });
}
