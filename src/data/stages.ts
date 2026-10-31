import { problems } from "./problems.ts";
import type { Stage } from "../game/types.ts";

function idsFor(stageId: string): string[] {
  return problems.filter((problem) => problem.stageId === stageId).map((problem) => problem.id);
}

export const stages: Stage[] = [
  {
    id: "stage-precursor",
    title: "切る前の234",
    summary: "ピークは1本だけです。残基と水の18を足しても234にならず、電荷の1が要ります。",
    problemIds: idsFor("stage-precursor"),
    briefingId: "brief-protein",
  },
  {
    id: "stage-difference",
    title: "質量の差",
    summary: "指定されたかけらの差や、端の質量から、アミノ酸を1つ選びます。",
    problemIds: idsFor("stage-difference"),
    briefingId: "brief-fragments",
  },
  {
    id: "stage-order",
    title: "順番を並べる",
    summary: "左のかけらと右のかけらを組み合わせて、3残基の順番を復元します。",
    problemIds: idsFor("stage-order"),
  },
  {
    id: "stage-sides",
    title: "左右を自分で決める",
    summary: "ピークに左右は書いてありません。足して切る前より1大きい組と、1と19の引き算で端を決めます。",
    problemIds: idsFor("stage-sides"),
  },
  {
    id: "stage-gap",
    title: "1本足りない",
    summary: "長さ4でピークが1本なく、PとVは2だけ違います。残った質量で最後の残基を決めます。",
    problemIds: idsFor("stage-gap"),
  },
  {
    id: "stage-residues",
    title: "残基を増やす",
    summary: "整数で1つに決まる残基を足します。端の1と19、隣との差は今までと同じです。",
    problemIds: idsFor("stage-residues"),
  },
  {
    id: "stage-close",
    title: "1と2の差",
    summary: "VとTは2、NとDは1、EとMは2違います。差を丸めずに残基を決めます。",
    problemIds: idsFor("stage-close"),
  },
  {
    id: "stage-protein",
    title: "タンパク質を絞り込む",
    summary: "短いペプチドを、候補のタンパク質が連続して含むかどうかで残します。",
    problemIds: idsFor("stage-protein"),
    briefingId: "brief-digest",
  },
  {
    id: "stage-isobar",
    title: "質量が同じでも",
    summary: "113はIかL、途中の128はKかQのままでも、ほかのペプチドで候補を落とせます。",
    problemIds: idsFor("stage-isobar"),
  },
  {
    id: "stage-cut",
    title: "分かれて見えた理由",
    summary: "ペプチドの右端がKかRに偏っていたのは、長い鎖がその右で分かれていたからです。",
    problemIds: idsFor("stage-cut"),
  },
  {
    id: "stage-main",
    title: "本編",
    summary: "途中の同じ質量は決めず、切れた端の128だけをKにして、候補を絞ります。",
    problemIds: idsFor("stage-main"),
  },
];
