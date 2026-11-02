import { problems } from "./problems.ts";
import type { Stage } from "../game/types.ts";

function idsFor(stageId: string): string[] {
  return problems.filter((problem) => problem.stageId === stageId).map((problem) => problem.id);
}

/** いまプレイヤーが通るのは、ペプチドを読むところだけ。タンパク質同定は protein_identification に隔離してある。 */
export const stages: Stage[] = [
  {
    id: "stage-read",
    title: "1本を読む",
    summary: "最初の1本は説明に沿って並べ、次からは自分で読みます。",
    problemIds: idsFor("stage-read"),
    briefingId: "brief-fragments",
  },
];
