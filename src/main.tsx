import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.tsx";
import { aminoAcids } from "./data/aminoAcids.ts";
import { briefings } from "./data/briefings.ts";
import { practiceProblems, practiceStages } from "./data/practice.ts";
import { problems } from "./data/problems.ts";
import { stages } from "./data/stages.ts";
import { assertPlayable } from "./game/validateProblem.ts";
import "./styles/global.css";

assertPlayable(problems, stages, aminoAcids, briefings);
// 練習問題の「並びが1つに決まる」検査は時間がかかるので、テストと生成スクリプトで行う。
assertPlayable(practiceProblems, practiceStages, aminoAcids, [], false);

const root = document.getElementById("root");
if (!root) throw new Error("root が見つかりません");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
