import { CANNOT_BUILD, type Problem } from "../game/types.ts";
import { aminoAcidCodesByMass, earlyChoices } from "./aminoAcids.ts";

/** 新しい残基は、それまでの候補を消さずに後ろへ足す。 */
const paletteGasv = ["G", "A", "S", "P", "V"];
const paletteFry = [...paletteGasv, "F", "R", "Y"];
const paletteHmw = [...paletteFry, "H", "M", "W"];
const paletteCey = [...paletteHmw, "C", "E"];
const paletteGat = [...paletteCey, "T"];
const paletteSna = [...paletteGat, "N", "D"];
/** 短い進行で、それまでに出した残基へ新しいものを足す。 */
const paletteRead = [...paletteGasv, "H", "M", "W"];
const paletteSampleK = [...paletteRead, "K"];
const paletteSampleFr = [...paletteSampleK, "F", "R"];

export const problems: Problem[] = [
  {
    id: "precursor-water",
    stageId: "stage-precursor",
    type: "choice",
    title: "水の18を足す",
    instruction:
      "このピークは、まだ切っていないペプチドです。234 しか出ていません。ボタンの数字は残基質量です。必要なアミノ酸をすべて選び、その合計に水（H と OH）の 18 を足してください。234 になる組がなければ、作れないを選んでください。順番はまだ問いません。",
    sequence: "GAS",
    shownPeakIds: ["intact"],
    focusPeakIds: ["intact"],
    peakLabelStyle: "side",
    question: { kind: "composition", plus: 18 },
    choices: earlyChoices,
    correctChoiceId: CANNOT_BUILD,
    explanation:
      "いちばん軽い G・A・S でも 57+71+87=215、そこに水の 18 を足すと 233 です。234 より 1 小さく、水だけではピークになりません。P や V はこれより重いので、さらにずれます。",
    hint: "選んだボタンの数字を足してから 18 を足し、234 ちょうどになるか見てください。",
  },
  {
    id: "precursor-charge",
    stageId: "stage-precursor",
    type: "choice",
    title: "電荷の1を足す",
    instruction:
      "同じ 234 です。残基の合計に水の 18 を足しても、ピークより 1 小さくなりました。電荷の 1 も足して、234 になるアミノ酸をすべて選んでください。届かなければ、作れないを選んでください。",
    sequence: "GAS",
    shownPeakIds: ["intact"],
    focusPeakIds: ["intact"],
    peakLabelStyle: "side",
    question: { kind: "composition", plus: 19 },
    choices: earlyChoices,
    correctChoiceId: "GAS",
    explanation:
      "215 に水の 18 を足すと 233 です。そこへ電荷の 1 を足すと 234 になります。切る前のピークは、残基の合計 + 19 です。この1本で分かるのは G・A・S が入っていることまでで、並び順はまだ決まりません。",
    scienceNote:
      "画面の数は、このゲームでは質量そのものです。実際の機械が出すのは質量を電荷で割った m/z で、電荷が1のときは同じ数になります。",
    hint: "前の問題で 233 だった組に、1 を足してみてください。",
  },
  {
    id: "difference-left",
    stageId: "stage-difference",
    type: "choice",
    title: "差を1つ読む",
    instruction:
      "この2つのピークは、どちらも左のかけらです。質量の差と同じ残基を、ボタンから選んでください。同じ側どうしの差では、左端の1は打ち消されます。",
    sequence: "GAS",
    shownPeakIds: ["left-1", "left-2"],
    focusPeakIds: ["left-1", "left-2"],
    peakLabelStyle: "side",
    question: { kind: "difference", peakIds: ["left-1", "left-2"] },
    choices: earlyChoices,
    correctChoiceId: "A",
    explanation:
      "長いかけらから短いかけらを引くと、増えた1残基だけが残ります。この差は、左から2番目のアミノ酸です。",
    scienceNote:
      "画面の数は、このゲームでは質量そのものです。実際の機械が出すのは質量を電荷で割った m/z で、電荷が1のときは同じ数になります。",
    hint: "大きい方から小さい方を引いてください。端の1は両方に入っているので、差には出ません。",
  },
  {
    id: "left-end",
    stageId: "stage-shelf",
    type: "choice",
    title: "左端を読む",
    instruction:
      "この左のかけらは、左端のアミノ酸1つだけを含みます。質量は「残基 + 1」です。1を引いた数字のボタンを選んでください。",
    sequence: "GAS",
    shownPeakIds: ["left-1"],
    focusPeakIds: ["left-1"],
    peakLabelStyle: "side",
    question: { kind: "end-residue", peakId: "left-1" },
    choices: earlyChoices,
    correctChoiceId: "G",
    explanation:
      "左のかけらの端は1です。切れた場所が電荷を持っていて、そこに別のプロトンは加算しません。",
    hint: "表示されている質量から1を引いてください。",
  },
  {
    id: "right-end",
    stageId: "stage-shelf",
    type: "choice",
    title: "右端を読む",
    instruction:
      "この右のかけらは、右端のアミノ酸1つだけを含みます。質量は「残基 + 19」です。19を引いた数字のボタンを選んでください。",
    sequence: "GAS",
    shownPeakIds: ["right-1"],
    focusPeakIds: ["right-1"],
    peakLabelStyle: "side",
    question: { kind: "end-residue", peakId: "right-1" },
    choices: earlyChoices,
    correctChoiceId: "S",
    explanation:
      "右のかけらは、切れた場所にHがついて普通のペプチドになり、さらに電荷を1つ持ちます。OH、そのH、電荷を合わせて19です。",
    scienceNote:
      "右端に付いているOHだけを足すと17になります。切断面のHと電荷が入るので、このゲームでは19です。",
    hint: "表示されている質量から19を引いてください。",
  },
  {
    id: "assemble-gas",
    stageId: "stage-read",
    type: "sequence-builder",
    title: "同じペプチドを並べる",
    instruction:
      "矢印の説明に沿って、3残基を並べてください。同じアミノ酸は、ボタンを繰り返し使えます。",
    sequence: "GAS",
    guide: [
      {
        peakId: "left-1",
        text: "58は、グリシン（57）に1を足した値です。グリシンは左端にあると考えられます。",
      },
      {
        peakId: "right-1",
        text: "106は、セリン（87）に19を足した値です。セリンは右端にあると考えられます。",
      },
      {
        peakId: "intact",
        text: "いちばん右の重いピーク234は、残基をすべて足して19を足した値です。234 − 19 − 57 − 87 = 71なので、真ん中はアラニンです。",
      },
    ],
    shownPeakIds: ["intact", "left-1", "left-2", "right-1", "right-2"],
    focusPeakIds: ["left-1", "left-2", "right-1"],
    peakLabelStyle: "depth",
    availableAminoAcids: ["S", "A", "G"],
    correctSequence: "GAS",
    explanation:
      "左端は短い左のかけらから、その次は左のかけらの差から、右端は短い右のかけらから読めます。",
    scienceNote:
      "実験では、左のかけらをbイオン、右のかけらをyイオンと呼びます。このゲームでは呼び方より、左右の端の質量を使います。",
    hint: "左端から1残基分の質量から1を引くと、左端です。右端から1残基分の質量から19を引くと、右端です。",
  },
  {
    id: "restore-asg",
    stageId: "stage-read",
    type: "sequence-builder",
    title: "順番が違う",
    instruction:
      "グリシン、アラニン、セリンの順番が違うペプチドです。説明なしで、左端と右端から読んで、残りを真ん中に置いてください。",
    sequence: "ASG",
    shownPeakIds: ["intact", "left-1", "left-2", "right-1", "right-2"],
    focusPeakIds: ["left-1", "right-1"],
    peakLabelStyle: "depth",
    availableAminoAcids: ["G", "S", "A"],
    correctSequence: "ASG",
    explanation: "両端が分かれば、長さ3の真ん中は残ったカードです。差のピークは確認に使えます。",
    hint: "いちばん短い左のかけらから1、いちばん短い右のかけらから19を引いてください。",
  },
  {
    id: "restore-sag-left",
    stageId: "stage-order",
    type: "sequence-builder",
    title: "右のかけらがない",
    instruction:
      "右のかけらは測れていません。左のかけらの差で左から2残基を読み、切る前の質量から19を引いた合計との差で、右端を決めてください。",
    sequence: "SAG",
    shownPeakIds: ["intact", "left-1", "left-2"],
    focusPeakIds: ["intact", "left-1", "left-2"],
    peakLabelStyle: "depth",
    availableAminoAcids: ["G", "A", "S"],
    correctSequence: "SAG",
    explanation:
      "切る前から19を引くと残基の合計です。そこから、すでに読めた残基を引くと、残った1残基になります。",
    hint: "左端から1残基分で左端、2残基分との差で真ん中です。切る前は残基の合計 + 19です。",
  },
  {
    id: "complement-sga",
    stageId: "stage-sides",
    type: "choice",
    title: "足して235",
    instruction:
      "どのピークが左で、どれが右かは書いてありません。左のかけらと、ペプチドの残り全部を含む右のかけらを足すと、切る前のピークより1大きくなります。234に1を足した235になる2本を選んでください。ピークを押すと、H- や -OH のメモを書けます。メモは判定に使いません。",
    sequence: "SGA",
    shownPeakIds: ["intact", "left-1", "left-2", "right-2"],
    focusPeakIds: ["left-1", "right-2"],
    peakLabelStyle: "side",
    question: { kind: "complement", peakIds: ["left-1", "right-2"] },
    choices: [
      { id: "left-1+right-2", sequence: "left-1+right-2", label: "88 と 147" },
      { id: "left-1+left-2", sequence: "left-1+left-2", label: "88 と 145" },
      { id: "left-2+right-2", sequence: "left-2+right-2", label: "145 と 147" },
      { id: "left-1+intact", sequence: "left-1+intact", label: "88 と 234" },
    ],
    correctChoiceId: "left-1+right-2",
    explanation:
      "88と147を足すと235です。234より1大きく、この2本でペプチド全体が、端の短いかけらと残り全部に分かれます。",
    scienceNote:
      "相補な組を足すと残基は1回ずつ入り、端の1と19が両方入ります。1+19=20なので、切る前（残基の合計+19）より1大きくなります。",
    hint: "表示されている組を順に足してください。235になる組は1つです。",
  },
  {
    id: "cap-sga",
    stageId: "stage-sides",
    type: "choice",
    title: "1を引くか、19を引くか",
    instruction:
      "88のピークが、左のかけらか右のかけらかを決めてください。左の端は残基に1を足した質量、右の端は残基に19を足した質量です。引いた結果がアミノ酸になるほうを選んでください。",
    sequence: "SGA",
    shownPeakIds: ["left-1"],
    focusPeakIds: ["left-1"],
    peakLabelStyle: "side",
    question: { kind: "fragment-side", peakId: "left-1", side: "left" },
    choices: [
      { id: "left", sequence: "left", label: "左のかけら" },
      { id: "right", sequence: "right", label: "右のかけら" },
    ],
    correctChoiceId: "left",
    explanation:
      "88−1=87でセリンです。88−19=69は、どのアミノ酸でもありません。だから88は左端のかけらです。",
    hint: "Gは57、Aは71、Sは87、Pは97、Vは99です。88から1を引いた数と、19を引いた数を、この中から探してください。",
  },
  {
    id: "unlabeled-sga",
    stageId: "stage-sides",
    type: "sequence-builder",
    title: "印のないスペクトル",
    instruction:
      "左右は書いてありません。ピークにメモを付けて端を決め、3残基を並べてください。足して235になる組は、短い端と残り全部です。短い端は、1を引いてアミノ酸になれば左、19を引いてアミノ酸になれば右です。",
    sequence: "SGA",
    shownPeakIds: ["intact", "left-1", "left-2", "right-1", "right-2"],
    focusPeakIds: ["left-1", "right-1"],
    peakLabelStyle: "side",
    availableAminoAcids: ["A", "G", "S"],
    correctSequence: "SGA",
    explanation:
      "相補な組と端の引き算だけで、左右の印がなくても順番が決まります。左端はセリン、次はグリシン、右端はアラニンです。",
    hint: "235になる組を見つけ、軽いほうから1と19を引いてください。アミノ酸になる引き方が、そのピークの端です。",
  },
  {
    id: "missing-gasv",
    stageId: "stage-gap",
    type: "sequence-builder",
    title: "1本足りない",
    instruction:
      "長さは4残基です。ピークが1本だけ測れていません。左右の印はありません。配られたアミノ酸は1つ余ります。Pは97、Vは99で、2だけ違います。メモで左右を決めて、切る前の質量から残った1残基を求めてください。",
    sequence: "GASV",
    shownPeakIds: ["intact", "left-1", "left-2", "left-3", "right-2", "right-3"],
    focusPeakIds: ["intact", "left-3"],
    peakLabelStyle: "side",
    availableAminoAcids: ["V", "P", "A", "G", "S"],
    correctSequence: "GASV",
    explanation:
      "左からG、A、Sと読めます。切る前の333から19を引くと残基の合計314です。57+71+87=215を引くと99で、Vです。Pの97では2足りません。測れていないのは、右端のVに19を足した118です。",
    scienceNote:
      "質量が2だけ違う残基は、その残基だけのピークが抜けると、残基の合計との差で見分けます。",
    hint: "端の引き算と、隣り合うピークの差で読める残基を先に決めます。1つだけ空いたら、残基の合計から引いてください。97ならP、99ならVです。",
  },
  {
    id: "end-w",
    stageId: "stage-residues",
    type: "choice",
    title: "重い右端",
    instruction:
      "右端から1残基分です。19を引いて、ボタンの質量と合わせてください。新しいアミノ酸も、ボタンの数字が残基質量です。",
    sequence: "GAW",
    shownPeakIds: ["right-1"],
    focusPeakIds: ["right-1"],
    peakLabelStyle: "side",
    question: { kind: "end-residue", peakId: "right-1" },
    choices: [...paletteGasv, "F", "Y", "W"].map((code) => ({ id: code, sequence: code })),
    correctChoiceId: "W",
    explanation: "205 − 19 = 186 で、トリプトファンです。F は 147、Y は 163 なので、この端には合いません。",
    hint: "表示されている質量から19を引いてください。",
  },
  {
    id: "seq-fry",
    stageId: "stage-residues",
    type: "sequence-builder",
    title: "3つの新しい残基",
    instruction:
      "左端は質量から1、右端は質量から19を引くと読めます。あいだは、隣り合うピークの差です。カードの数字が残基質量です。前までのアミノ酸も残してあります。3残基なので、配られたものは全部は使いません。",
    sequence: "FRY",
    shownPeakIds: ["intact", "left-1", "left-2", "right-1", "right-2"],
    focusPeakIds: ["left-1", "right-1"],
    peakLabelStyle: "depth",
    availableAminoAcids: paletteFry,
    correctSequence: "FRY",
    explanation: "左端はフェニルアラニン、次はアルギニン、右端はチロシンです。",
    hint: "いちばん短い左のかけらから1、いちばん短い右のかけらから19を引いてください。",
  },
  {
    id: "seq-hmw",
    stageId: "stage-read",
    type: "sequence-builder",
    title: "もう一組",
    instruction:
      "アミノ酸はすべて並んでいます。同じ質量のものは1つのボタンです。同じアミノ酸が2回入ることがあります。全部は使いません。",
    sequence: "WHW",
    shownPeakIds: ["intact", "left-1", "left-2", "right-1", "right-2"],
    focusPeakIds: ["left-1", "right-1"],
    peakLabelStyle: "depth",
    availableAminoAcids: aminoAcidCodesByMass,
    correctSequence: "WHW",
    explanation: "左端はトリプトファン、次はヒスチジン、右端もトリプトファンです。",
    hint: "短い左のかけらから1、短い右のかけらから19を引いてください。",
  },
  {
    id: "seq-cey",
    stageId: "stage-residues",
    type: "sequence-builder",
    title: "印なしで新しい残基",
    instruction:
      "左右は書いてありません。端の1と19、足して切る前より1大きい組で、3残基を並べてください。",
    sequence: "CEY",
    shownPeakIds: ["intact", "left-1", "left-2", "right-1", "right-2"],
    focusPeakIds: ["left-1", "right-1"],
    peakLabelStyle: "side",
    availableAminoAcids: paletteCey,
    correctSequence: "CEY",
    explanation: "左端はシステイン、次はグルタミン酸、右端はチロシンです。",
    hint: "切る前の質量に1を足した数になる組を探してください。軽い端から1と19を引いて、アミノ酸になるほうを左端にします。",
  },
  {
    id: "gap-gat",
    stageId: "stage-close",
    type: "sequence-builder",
    title: "VとTは2違う",
    instruction:
      "長さは3残基です。ピークが1本だけ測れていません。V は 99、T は 101 で、2だけ違います。配られたアミノ酸は全部は使いません。残基の合計との差で、空いた残基を決めてください。",
    sequence: "GAT",
    shownPeakIds: ["intact", "left-1", "left-2", "right-2"],
    focusPeakIds: ["intact", "left-2"],
    peakLabelStyle: "side",
    availableAminoAcids: paletteGat,
    correctSequence: "GAT",
    explanation:
      "左から G、A と読めます。切る前から19を引いた残基の合計との差は101で、T です。V の99では2足りません。",
    hint: "読めた残基を、残基の合計から引いてください。99ならV、101ならTです。",
  },
  {
    id: "diff-sna",
    stageId: "stage-close",
    type: "sequence-builder",
    title: "NとDは1違う",
    instruction:
      "N は 114、D は 115 で、1だけ違います。隣り合うピークの差を、そのまま残基質量にしてください。配られたアミノ酸は全部は使いません。",
    sequence: "SNA",
    shownPeakIds: ["intact", "left-1", "left-2", "right-1", "right-2"],
    focusPeakIds: ["left-1", "left-2"],
    peakLabelStyle: "side",
    availableAminoAcids: paletteSna,
    correctSequence: "SNA",
    explanation: "隣との差は114なのでアスパラギンです。115のアスパラギン酸では、そのピークが1重くなります。",
    hint: "短い端を先に決めてから、その隣のピークとの差を見てください。",
  },
  {
    id: "seq-aem",
    stageId: "stage-close",
    type: "sequence-builder",
    title: "EとMは2違う",
    instruction:
      "E は 129、M は 131 です。差が2ある残基を、ピークの差のまま並べてください。",
    sequence: "AEM",
    shownPeakIds: ["intact", "left-1", "left-2", "right-1", "right-2"],
    focusPeakIds: ["left-1", "left-2", "right-1"],
    peakLabelStyle: "depth",
    availableAminoAcids: paletteSna,
    correctSequence: "AEM",
    explanation: "左端はアラニン、次の差は129でグルタミン酸、右端は131でメチオニンです。",
    hint: "左端から2残基分と、1残基分の差が、真ん中の残基です。",
  },
  {
    id: "seq-gak",
    stageId: "stage-shelf",
    type: "sequence-builder",
    title: "Kは128",
    instruction:
      "新しい残基 K は 128 です。左端は質量から1、右端は質量から19を引いて、3残基を並べてください。配られたものは全部は使いません。",
    sequence: "GAK",
    shownPeakIds: ["intact", "left-1", "left-2", "right-1", "right-2"],
    focusPeakIds: ["right-1"],
    peakLabelStyle: "depth",
    availableAminoAcids: paletteSampleK,
    correctSequence: "GAK",
    explanation: "左端はグリシン、次はアラニン、右端は128でリジンです。",
    hint: "右端の短いかけらから19を引いてください。",
  },
  {
    id: "seq-gfr",
    stageId: "stage-shelf",
    type: "sequence-builder",
    title: "もう1本のペプチド",
    instruction:
      "別のペプチドです。F は 147、R は 156 です。端の引き算で並べてください。配られたものは全部は使いません。",
    sequence: "GFR",
    shownPeakIds: ["intact", "left-1", "left-2", "right-1", "right-2"],
    focusPeakIds: ["left-1", "right-1"],
    peakLabelStyle: "depth",
    availableAminoAcids: paletteSampleFr,
    correctSequence: "GFR",
    explanation: "左端はグリシン、次はフェニルアラニン、右端はアルギニンです。",
    hint: "短い左のかけらから1、短い右のかけらから19を引いてください。",
  }
];
