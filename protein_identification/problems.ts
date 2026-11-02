/** 2026-11-02 にプレイから隔離。アプリ本体はこのフォルダを読み込まない。 */
import type { ShelvedProblem } from "./types.ts";

export const proteinProblems: ShelvedProblem[] = [
{
    id: "protein-one",
    stageId: "stage-identify",
    type: "protein",
    title: "1本では絞れない",
    instruction:
      "このピークは257です。残基の合計に1を足した質量なので、N末端側のかけらです。257 − 1 = 256で、G・A・Kです。N末端がこの並びの候補をすべて選んでください。1本では、それ以上は絞れません。",
    sequence: "GAK",
    shownPeakIds: ["intact"],
    focusPeakIds: ["intact"],
    peakLabelStyle: "side",
    candidates: [
      { id: "aka", name: "アカ", sequence: "GAKGFR" },
      { id: "ao", name: "アオ", sequence: "GAKGMH" },
      { id: "kii", name: "キイ", sequence: "MHWGAK" },
    ],
    peptides: [["G", "A", "K"]],
    peptideEnds: ["n"],
    observedMasses: [257],
    correctCandidateIds: ["aka", "ao"],
    resolveCutEnds: false,
    explanation:
      "257 − 1 = 256なので、N末端側の GAK です。アカとアオはどちらもN末端が GAK です。キイの GAK はC末端側で、その質量は 256 + 19 = 275 になります。257には合いません。この1本ではアカとアオを分けられません。",
    hint: "19を足した質量ならC末端側です。257は1を足しています。",
  },
  {
    id: "protein-two",
    stageId: "stage-identify",
    type: "protein",
    title: "もう1本で決まる",
    instruction:
      "N末端側の257（GAK）に加えて、379（GFR）も読めました。両方のピークが出ています。2本とも合う候補だけを選んでください。",
    sequence: "GFR",
    shownPeakIds: ["intact"],
    focusPeakIds: ["intact"],
    peakLabelStyle: "side",
    candidates: [
      { id: "aka", name: "アカ", sequence: "GAKGFR" },
      { id: "ao", name: "アオ", sequence: "GAKGMH" },
      { id: "kii", name: "キイ", sequence: "MHWGAK" },
    ],
    peptides: [
      ["G", "A", "K"],
      ["G", "F", "R"],
    ],
    peptideEnds: ["n"],
    observedMasses: [257, 379],
    correctCandidateIds: ["aka"],
    resolveCutEnds: false,
    explanation:
      "N末端側の GAK（257）に合うのはアカとアオです。GFR（379）を含むのはアカだけなので、タンパク質はアカに決まります。",
  },
  {
    id: "isobar-open",
    stageId: "stage-isobar",
    type: "protein",
    title: "113はIでもLでもよい",
    instruction:
      "質量113は、イソロイシンでもロイシンでも同じです。読めたペプチドは G(I/L)S と書きます。この質量で合う候補をすべて選んでください。どちらに決まらなくても、候補は絞れます。",
    sequence: "GIS",
    shownPeakIds: ["intact", "left-1", "left-2", "right-1"],
    focusPeakIds: ["left-2"],
    peakLabelStyle: "side",
    candidates: [
      { id: "aka", name: "アカ", sequence: "GISGFR" },
      { id: "ao", name: "アオ", sequence: "GLSGMH" },
      { id: "kii", name: "キイ", sequence: "GVSGFR" },
    ],
    peptides: [["G", ["I", "L"], "S"]],
    correctCandidateIds: ["aka", "ao"],
    resolveCutEnds: false,
    explanation:
      "113は I でも L でもピークは同じです。アカの I も、アオの L も一致します。キイの V は99なので残しません。タンパク質はまだ2つです。",
    scienceNote:
      "イソロイシンとロイシンは組成が同じなので、質量を細かくしてもこの差は分かれません。",
  },
  {
    id: "isobar-narrow",
    stageId: "stage-isobar",
    type: "protein",
    title: "同じ質量のままで決まる",
    instruction:
      "G(I/L)S に加えて GFR も読めました。両方のピークが出ています。113が I か L か決まっていなくても、2本とも含む候補を選んでください。",
    sequence: "GIS",
    shownPeakIds: ["intact"],
    focusPeakIds: ["intact"],
    peakLabelStyle: "side",
    candidates: [
      { id: "aka", name: "アカ", sequence: "GISGFR" },
      { id: "ao", name: "アオ", sequence: "GLSGMH" },
      { id: "kii", name: "キイ", sequence: "GVSGFR" },
    ],
    peptides: [
      ["G", ["I", "L"], "S"],
      ["G", "F", "R"],
    ],
    observedMasses: [276, 379],
    correctCandidateIds: ["aka"],
    resolveCutEnds: false,
    explanation:
      "G(I/L)S はアカとアオに合います。GFR を含むのはアカだけです。未決定の113が残ったまま、タンパク質はアカに決まります。",
  },
  {
    id: "isobar-kq",
    stageId: "stage-isobar",
    type: "protein",
    title: "128はKでもQでもよい",
    instruction:
      "配列の途中にある128は、リジンでもグルタミンでも同じ質量です。ペプチドは A(K/Q)M と WY です。切断の話はまだ使いません。2本とも含む候補を選んでください。",
    sequence: "AKM",
    shownPeakIds: ["intact"],
    focusPeakIds: ["intact"],
    peakLabelStyle: "side",
    candidates: [
      { id: "aka", name: "アカ", sequence: "AKMWY" },
      { id: "ao", name: "アオ", sequence: "AQMGFR" },
    ],
    peptides: [
      ["A", ["K", "Q"], "M"],
      ["W", "Y"],
    ],
    correctCandidateIds: ["aka"],
    resolveCutEnds: false,
    explanation:
      "A(K/Q)M はアカの K にもアオの Q にも合います。WY を含むのはアカだけなので、128を決めなくてもタンパク質はアカです。",
  },
  {
    id: "cut-reason",
    stageId: "stage-ends",
    type: "choice",
    title: "右端が偏っている",
    instruction:
      "タンパク質を絞り込んだときに読んだペプチドを振り返ってください。GAK の右端は K、GFR の右端は R でした。長い鎖がペプチドに分かれて見えていた理由として合うものを選んでください。",
    sequence: "GAK",
    shownPeakIds: ["intact", "right-1"],
    focusPeakIds: ["right-1"],
    peakLabelStyle: "side",
    question: { kind: "labeled" },
    choices: [
      {
        id: "cut",
        sequence: "cut",
        label: "KかRの右で、長い鎖が分かれていた",
      },
      {
        id: "fragment",
        sequence: "fragment",
        label: "右のかけらの端が、いつも19だから",
      },
      {
        id: "always",
        sequence: "always",
        label: "タンパク質の右端は、いつもKかRだから",
      },
    ],
    correctChoiceId: "cut",
    explanation:
      "見えていたペプチドは、長い鎖が K または R の右で分かれたものです。右のかけらの19は、1本のペプチドをさらに切ったときの端で、この分かれ方とは別です。タンパク質本来の右端だけは、この切れ目ではないので、K でも R でもないことがあります。",
    scienceNote:
      "分解に使うのが酵素です。長い鎖は K か R の右で分かれ、分かれたペプチドを1本ずつ見ます。",
  },
  {
    id: "cut-resolve",
    stageId: "stage-ends",
    type: "protein",
    title: "切れた端の128はK",
    instruction:
      "GA(K/Q) と GFR が、別々のペプチドとして読めました。別々に見えたということは、128の右で鎖が分かれています。その端は K です。Q の右では分かれません。両方のペプチドを含む候補を選んでください。",
    sequence: "GAK",
    shownPeakIds: ["intact", "right-1"],
    focusPeakIds: ["right-1"],
    peakLabelStyle: "side",
    candidates: [
      { id: "aka", name: "アカ", sequence: "GAKGFR" },
      { id: "ao", name: "アオ", sequence: "GAQGFR" },
    ],
    peptides: [
      ["G", "A", ["K", "Q"]],
      ["G", "F", "R"],
    ],
    correctCandidateIds: ["aka"],
    resolveCutEnds: true,
    explanation:
      "切れた端の128は K なので、ペプチドは GAK と読みます。GAK を含むのはアカだけです。アオの Q の右では、この2本には分かれません。",
  },
  {
    id: "main-internal",
    stageId: "stage-main",
    type: "protein",
    title: "途中の128は決まらない",
    instruction:
      "A(K/Q)M の128は配列の途中です。切れた端ではないので、K か Q のままにしてください。もう1本の GFR と合わせて、両方を含む候補を選んでください。",
    sequence: "AKM",
    shownPeakIds: ["intact"],
    focusPeakIds: ["intact"],
    peakLabelStyle: "side",
    candidates: [
      { id: "aka", name: "アカ", sequence: "AKMGFR" },
      { id: "ao", name: "アオ", sequence: "AQMGFR" },
      { id: "kii", name: "キイ", sequence: "AKMWY" },
    ],
    peptides: [
      ["A", ["K", "Q"], "M"],
      ["G", "F", "R"],
    ],
    correctCandidateIds: ["aka", "ao"],
    resolveCutEnds: true,
    explanation:
      "途中の128は K でも Q でも一致します。GFR を含まないキイは残しません。アカとアオはどちらも説明できるので、タンパク質は2つのままです。",
  },
  {
    id: "main-both",
    stageId: "stage-main",
    type: "protein",
    title: "113と、切れた128",
    instruction:
      "G(I/L)S の113は、切れ目では決まりません。GF(K/Q) は別のペプチドとして見えたので、その端の128は K です。2本とも含む候補を選んでください。",
    sequence: "GIS",
    shownPeakIds: ["intact"],
    focusPeakIds: ["intact"],
    peakLabelStyle: "side",
    candidates: [
      { id: "aka", name: "アカ", sequence: "GISGFK" },
      { id: "ao", name: "アオ", sequence: "GLSGFQ" },
      { id: "kii", name: "キイ", sequence: "GVSGFK" },
    ],
    peptides: [
      ["G", ["I", "L"], "S"],
      ["G", "F", ["K", "Q"]],
    ],
    correctCandidateIds: ["aka"],
    resolveCutEnds: true,
    explanation:
      "切れた端は GFK です。アオの GFQ は、このペプチドになりません。G(I/L)S に合うのはアカとアオで、キイの V は合いません。両方を含むのはアカだけです。",
  }
];
