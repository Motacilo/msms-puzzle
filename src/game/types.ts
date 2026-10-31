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

export type SequenceBuilderProblem = ProblemBase & {
  type: "sequence-builder";
  availableAminoAcids: string[];
  correctSequence: string;
};

export type ProteinCandidate = {
  id: string;
  name: string;
  sequence: string;
};

/** 観測した1残基。質量が同じときは2文字の組。 */
export type ResidueObservation = string | readonly [string, string];

export type ProteinProblem = ProblemBase & {
  type: "protein";
  candidates: ProteinCandidate[];
  peptides: ResidueObservation[][];
  correctCandidateIds: string[];
  /** ペプチド末尾の K/Q を、切れた端として K に確定してから照合する。 */
  resolveCutEnds: boolean;
  /**
   * ペプチドが付く端。n はタンパク質のN末端、c はC末端。
   * 省略した位置は、配列のどこに含まれていてもよい。
   */
  peptideEnds?: readonly ("n" | "c")[];
  /**
   * スペクトルに出す質量。ペプチドと同じ順。
   * 全長のN末端側は通常のピークに出ないため、あるときは配列のピークの代わりに使う。
   */
  observedMasses?: readonly number[];
};

export type Problem = ChoiceProblem | SequenceBuilderProblem | ProteinProblem;

export type Stage = {
  id: string;
  title: string;
  summary: string;
  problemIds: string[];
  /** このステージの問題に入る前に読む説明。 */
  briefingId?: string;
};

/** 解かずに読む説明。判定はない。 */
export type Briefing = {
  id: string;
  title: string;
  paragraphs: string[];
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
  memos?: Record<string, FragmentMemo>;
  /** タンパク質の候補で、残すと選んだ ID。 */
  selectedIds?: string[];
};

export type Judgment =
  | { status: "incomplete"; message: string }
  | { status: "correct"; answer: string; correct: string }
  | { status: "incorrect"; answer: string; correct: string };
