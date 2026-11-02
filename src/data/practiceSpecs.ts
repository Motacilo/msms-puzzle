// scripts/generatePractice.ts が書き出した。手で直さず、スクリプトを直して作り直す。
export type PracticeFeature =
  | "full"
  | "repeat"
  | "no-end1"
  | "no-end12"
  | "no-end1-repeat"
  | "gaps"
  | "no-precursor"
  | "ambiguous"
  | "ilkq"
  | "combo1"
  | "combo2";

export type PracticeSpec = {
  id: string;
  length: number;
  feature: PracticeFeature;
  sequence: string;
  shownPeakIds: readonly string[];
};

export const practiceSpecs: readonly PracticeSpec[] = [
  { id: "p3-01", length: 3, feature: "full", sequence: "VTC", shownPeakIds: ["intact","left-1","left-2","right-1","right-2"] },
  { id: "p3-02", length: 3, feature: "repeat", sequence: "HPP", shownPeakIds: ["intact","left-1","left-2","right-1","right-2"] },
  { id: "p3-03", length: 3, feature: "no-end1", sequence: "SNM", shownPeakIds: ["intact","left-2","right-2"] },
  { id: "p3-04", length: 3, feature: "no-end1-repeat", sequence: "WYW", shownPeakIds: ["intact","left-2","right-2"] },
  { id: "p3-05", length: 3, feature: "gaps", sequence: "GCR", shownPeakIds: ["intact","left-2","right-2"] },
  { id: "p3-06", length: 3, feature: "no-precursor", sequence: "ETH", shownPeakIds: ["left-1","left-2","right-1","right-2"] },
  { id: "p3-07", length: 3, feature: "ambiguous", sequence: "SVG", shownPeakIds: ["intact","left-2","right-1","right-2"] },
  { id: "p3-08", length: 3, feature: "ilkq", sequence: "LYA", shownPeakIds: ["intact","left-1","left-2","right-1","right-2"] },
  { id: "p3-09", length: 3, feature: "combo1", sequence: "PMF", shownPeakIds: ["left-2","right-1","right-2"] },
  { id: "p3-10", length: 3, feature: "combo2", sequence: "YNY", shownPeakIds: ["left-1","left-2","right-1"] },
  { id: "p4-01", length: 4, feature: "full", sequence: "EFNG", shownPeakIds: ["intact","left-1","left-2","left-3","right-1","right-2","right-3"] },
  { id: "p4-02", length: 4, feature: "repeat", sequence: "FFFG", shownPeakIds: ["intact","left-1","left-2","left-3","right-1","right-2","right-3"] },
  { id: "p4-03", length: 4, feature: "no-end1", sequence: "STVH", shownPeakIds: ["intact","left-2","left-3","right-2","right-3"] },
  { id: "p4-04", length: 4, feature: "no-end1-repeat", sequence: "SRYS", shownPeakIds: ["intact","left-2","left-3","right-2","right-3"] },
  { id: "p4-05", length: 4, feature: "gaps", sequence: "NSFG", shownPeakIds: ["intact","left-1","right-1","right-2","right-3"] },
  { id: "p4-06", length: 4, feature: "no-precursor", sequence: "NRPE", shownPeakIds: ["left-1","left-2","left-3","right-1","right-2","right-3"] },
  { id: "p4-07", length: 4, feature: "ambiguous", sequence: "MVVG", shownPeakIds: ["intact","left-1","left-2","left-3","right-2","right-3"] },
  { id: "p4-08", length: 4, feature: "ilkq", sequence: "NNSK", shownPeakIds: ["intact","left-1","left-2","left-3","right-1","right-2","right-3"] },
  { id: "p4-09", length: 4, feature: "combo1", sequence: "GADC", shownPeakIds: ["left-2","left-3","right-2","right-3"] },
  { id: "p4-10", length: 4, feature: "combo2", sequence: "MYYV", shownPeakIds: ["left-1","left-3","right-1","right-2"] },
  { id: "p5-01", length: 5, feature: "full", sequence: "SCRVN", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","right-1","right-2","right-3","right-4"] },
  { id: "p5-02", length: 5, feature: "repeat", sequence: "AVYCA", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","right-1","right-2","right-3","right-4"] },
  { id: "p5-03", length: 5, feature: "no-end1", sequence: "NPTYC", shownPeakIds: ["intact","left-2","left-3","left-4","right-2","right-3","right-4"] },
  { id: "p5-04", length: 5, feature: "no-end12", sequence: "TCARH", shownPeakIds: ["intact","left-3","left-4","right-3","right-4"] },
  { id: "p5-05", length: 5, feature: "gaps", sequence: "AEDVT", shownPeakIds: ["intact","left-2","left-3","left-4","right-1","right-2","right-4"] },
  { id: "p5-06", length: 5, feature: "no-precursor", sequence: "VMTYS", shownPeakIds: ["left-1","left-2","left-3","left-4","right-1","right-2","right-3","right-4"] },
  { id: "p5-07", length: 5, feature: "ambiguous", sequence: "SAGDD", shownPeakIds: ["intact","left-1","left-3","right-1","right-2","right-3"] },
  { id: "p5-08", length: 5, feature: "ilkq", sequence: "PKPNA", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","right-1","right-2","right-3","right-4"] },
  { id: "p5-09", length: 5, feature: "combo1", sequence: "WMCYP", shownPeakIds: ["left-2","left-3","left-4","right-2","right-3","right-4"] },
  { id: "p5-10", length: 5, feature: "combo2", sequence: "FSNSW", shownPeakIds: ["left-1","left-2","left-4","right-1","right-2","right-3"] },
  { id: "p6-01", length: 6, feature: "full", sequence: "PDMTYV", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","left-5","right-1","right-2","right-3","right-4","right-5"] },
  { id: "p6-02", length: 6, feature: "repeat", sequence: "TNCTMP", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","left-5","right-1","right-2","right-3","right-4","right-5"] },
  { id: "p6-03", length: 6, feature: "no-end1", sequence: "PEWHCV", shownPeakIds: ["intact","left-2","left-3","left-4","left-5","right-2","right-3","right-4","right-5"] },
  { id: "p6-04", length: 6, feature: "no-end12", sequence: "FWETDH", shownPeakIds: ["intact","left-3","left-4","left-5","right-3","right-4","right-5"] },
  { id: "p6-05", length: 6, feature: "gaps", sequence: "SMTRYF", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","left-5","right-2","right-4","right-5"] },
  { id: "p6-06", length: 6, feature: "no-precursor", sequence: "FVDGTN", shownPeakIds: ["left-1","left-2","left-3","left-4","left-5","right-1","right-2","right-3","right-4","right-5"] },
  { id: "p6-07", length: 6, feature: "ambiguous", sequence: "GAYVNG", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","left-5","right-1","right-3","right-4"] },
  { id: "p6-08", length: 6, feature: "ilkq", sequence: "CWLFKP", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","left-5","right-1","right-2","right-3","right-4","right-5"] },
  { id: "p6-09", length: 6, feature: "combo1", sequence: "TECSNY", shownPeakIds: ["left-2","left-3","left-4","left-5","right-2","right-3","right-4","right-5"] },
  { id: "p6-10", length: 6, feature: "combo2", sequence: "SYYEGR", shownPeakIds: ["left-1","left-2","left-3","left-4","left-5","right-1","right-4"] },
  { id: "p7-01", length: 7, feature: "full", sequence: "MDGVRTF", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","left-5","left-6","right-1","right-2","right-3","right-4","right-5","right-6"] },
  { id: "p7-02", length: 7, feature: "repeat", sequence: "VEERHDH", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","left-5","left-6","right-1","right-2","right-3","right-4","right-5","right-6"] },
  { id: "p7-03", length: 7, feature: "no-end1", sequence: "CNAVSDH", shownPeakIds: ["intact","left-2","left-3","left-4","left-5","left-6","right-2","right-3","right-4","right-5","right-6"] },
  { id: "p7-04", length: 7, feature: "no-end12", sequence: "VDYGCST", shownPeakIds: ["intact","left-3","left-4","left-5","left-6","right-3","right-4","right-5","right-6"] },
  { id: "p7-05", length: 7, feature: "gaps", sequence: "CPYWGMT", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","left-5","left-6","right-1","right-3","right-4"] },
  { id: "p7-06", length: 7, feature: "no-precursor", sequence: "SYEGRAH", shownPeakIds: ["left-1","left-2","left-3","left-4","left-5","left-6","right-1","right-2","right-3","right-4","right-5","right-6"] },
  { id: "p7-07", length: 7, feature: "ambiguous", sequence: "EFVGVAG", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","left-5","right-1","right-2","right-3","right-4","right-5"] },
  { id: "p7-08", length: 7, feature: "ilkq", sequence: "KSLCVFS", shownPeakIds: ["intact","left-1","left-2","left-3","left-4","left-5","left-6","right-1","right-2","right-3","right-4","right-5","right-6"] },
  { id: "p7-09", length: 7, feature: "combo1", sequence: "RMWNGDE", shownPeakIds: ["left-2","left-3","left-4","left-5","left-6","right-2","right-3","right-4","right-5","right-6"] },
  { id: "p7-10", length: 7, feature: "combo2", sequence: "VYGYTKH", shownPeakIds: ["left-2","left-3","left-5","left-6","right-1","right-3","right-4","right-5","right-6"] },
];
