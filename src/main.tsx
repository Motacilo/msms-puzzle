import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.tsx";
import { aminoAcids } from "./data/aminoAcids.ts";
import { briefings } from "./data/briefings.ts";
import { problems } from "./data/problems.ts";
import { stages } from "./data/stages.ts";
import { assertPlayable } from "./game/validateProblem.ts";
import "./styles/global.css";

assertPlayable(problems, stages, aminoAcids, briefings);

const root = document.getElementById("root");
if (!root) throw new Error("root が見つかりません");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
