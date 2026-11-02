export const LEFT_CAP = 1;
export const RIGHT_CAP = 19;

export type AminoAcid = {
  code: string;
  nameJa: string;
  residueMass: number;
};

export type FragmentSide = "left" | "right" | "intact";

export type Peak = {
  id: string;
  mass: number;
  side: FragmentSide;
  depth: number;
  label: string;
  /** 0より大きく1以下。並びの判定には使わない。 */
  intensity: number;
};

export type BuiltPeptide = {
  sequence: string;
  residueMasses: number[];
  residueSum: number;
  intactMass: number;
  peaks: Peak[];
};

export type Choice = {
  id: string;
  sequence: string;
  /** 残基ではない選択肢の表示文。ピークの組や、左右の判定に使う。 */
  label?: string;
};

/** 組み合わせ問題で、どの残基を足してもピークに届かないときの選択。 */
export const CANNOT_BUILD = "impossible";
export const CANNOT_BUILD_LABEL = "作れない";

export type ChoiceQuestion =
  | { kind: "difference"; peakIds: [string, string] }
  | { kind: "end-residue"; peakId: string }
  | { kind: "composition"; plus: 18 | 19 }
  | { kind: "complement"; peakIds: [string, string] }
  | { kind: "fragment-side"; peakId: string; side: "left" | "right" }
  | { kind: "labeled" };

export type ProblemBase = {
  id: string;
  stageId: string;
  title: string;
  instruction: string;
  sequence: string;
  shownPeakIds: string[];
  focusPeakIds: string[];
  /** 序盤の選択式は側だけ、並べる問題は端からの残基数も見せる。 */
  peakLabelStyle: "side" | "depth";
  explanation: string;
  scienceNote?: string;
  hint?: string;
};

export type ChoiceProblem = ProblemBase & {
  type: "choice";
  question: ChoiceQuestion;
  choices: Choice[];
  correctChoiceId: string;
};

export type GuideStep = {
  peakId: string;
  text: string;
};

export type SequenceBuilderProblem = ProblemBase & {
  type: "sequence-builder";
  availableAminoAcids: string[];
  correctSequence: string;
  /** 最初の並べる問題で、ピークを順に示して解かせる。 */
  guide?: readonly GuideStep[];
  /**
   * 練習問題。ピークは質量だけで左右の印がなく、見えていないピークがある。
   * 見えているピークと矛盾しない配列が、長さを決めたうえで1つだけであることを検証する。
   */
  deduce?: {
    /** 画面に出す特徴の名前（title と同じ並び）。 */
    features: readonly string[];
  };
};

export type Problem = ChoiceProblem | SequenceBuilderProblem;

export type Stage = {
  id: string;
  title: string;
  summary: string;
  problemIds: string[];
  /** このステージの問題に入る前に読む説明。 */
  briefingId?: string;
};

export type LessonFigureKind = "goal" | "measure" | "cut" | "spectrum";

export type BriefingPage = {
  kicker: string;
  text: string;
  figure: LessonFigureKind;
};

/** 解かずに読む説明。判定はない。中でページをめくる。 */
export type Briefing = {
  id: string;
  title: string;
  pages: readonly BriefingPage[];
};

/** ピークに付ける、プレイヤー自身のかけらメモ。判定には使わない。 */
export type FragmentMemo = {
  residues: string[];
  hydrogen: boolean;
  hydroxyl: boolean;
};

export type AnswerDraft = {
  choiceId: string | null;
  placed: string[];
  /** ピークごとのメモ。1つのピークに複数つけられる。 */
  memos?: Record<string, FragmentMemo[]>;
  /**
   * 2つのピークの間のメモ。キーは「質量の小さいほうのピークID|大きいほうのピークID」。
   * 1つの間に複数つけられる。
   */
  rangeMemos?: Record<string, FragmentMemo[]>;
  /** 問題ごとの自由メモ。判定には使わない。 */
  freeNote?: string;
};

export type Judgment =
  | { status: "incomplete"; message: string }
  | { status: "correct"; answer: string; correct: string }
  | { status: "incorrect"; answer: string; correct: string };
