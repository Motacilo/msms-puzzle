/** 2026-11-02 にプレイから隔離。アプリ本体はこのフォルダを読み込まない。 */

export type ResidueObservation = string | readonly [string, string];

export type ProteinCandidate = {
  id: string;
  name: string;
  sequence: string;
};

export type Choice = {
  id: string;
  sequence: string;
  label?: string;
};

type ProblemFields = {
  id: string;
  stageId: string;
  title: string;
  instruction: string;
  sequence: string;
  shownPeakIds: string[];
  focusPeakIds: string[];
  peakLabelStyle: "side" | "depth";
  explanation: string;
  scienceNote?: string;
  hint?: string;
};

/** 候補配列にペプチドが含まれるかでタンパク質を残す問題。 */
export type ProteinMatchProblem = ProblemFields & {
  type: "protein";
  candidates: ProteinCandidate[];
  peptides: ResidueObservation[][];
  correctCandidateIds: string[];
  resolveCutEnds: boolean;
  peptideEnds?: readonly ("n" | "c")[];
  observedMasses?: readonly number[];
};

/** 切断の理由を文章で選ぶ問題。同定の説明に属する。 */
export type CutReasonProblem = ProblemFields & {
  type: "choice";
  question: { kind: "labeled" };
  choices: Choice[];
  correctChoiceId: string;
};

export type ShelvedProblem = ProteinMatchProblem | CutReasonProblem;
