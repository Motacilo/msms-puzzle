import type { Briefing } from "../game/types.ts";

export const briefings: readonly Briefing[] = [
  {
    id: "brief-fragments",
    title: "並びを当てる",
    pages: [
      {
        kicker: "並びを当てる",
        text: "アミノ酸の並びを当てるゲームです。",
        figure: "goal",
      },
      {
        kicker: "装置に入る",
        text: "装置に入ると、アミノ酸の質量の合計に19を足したピークになります。",
        figure: "measure",
      },
      {
        kicker: "途中で分かれる",
        text: "装置の中で切れて、できたものが見えます。左のかけらだけは、ほかと違って1を足した値です。",
        figure: "cut",
      },
      {
        kicker: "ピークはいくつも",
        text: "切る位置が変わると、別のピークも出ます。",
        figure: "spectrum",
      },
    ],
  },
];
