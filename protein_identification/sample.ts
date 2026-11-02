/** 2026-11-02 にプレイから隔離。アプリ本体はこのフォルダを読み込まない。 */

import type { ResidueObservation } from "./types.ts";

/** このプレイで特定する、1つのサンプルの候補。 */
export const sampleCandidates = [
  { id: "aka", name: "アカ", sequence: "GAKGFR" },
  { id: "ao", name: "アオ", sequence: "GAKGMH" },
  { id: "kii", name: "キイ", sequence: "MHWGAK" },
] as const;

export type SampleView = {
  peptides: ResidueObservation[][];
  ends: ("n" | undefined)[];
  identifiedId: string | null;
  statusLine: string;
};

export function sampleView(clearedProblemIds: readonly string[]): SampleView {
  if (clearedProblemIds.includes("protein-two")) {
    return {
      peptides: [
        ["G", "A", "K"],
        ["G", "F", "R"],
      ],
      ends: ["n", undefined],
      identifiedId: "aka",
      statusLine: "このサンプルのタンパク質はアカです。",
    };
  }
  if (clearedProblemIds.includes("protein-one")) {
    return {
      peptides: [["G", "A", "K"]],
      ends: ["n"],
      identifiedId: null,
      statusLine: "N末端の GAK では、アカとアオが残っています。まだ1つには決まりません。",
    };
  }
  return {
    peptides: [],
    ends: [],
    identifiedId: null,
    statusLine: "入っているタンパク質を、この3つから特定します。",
  };
}
