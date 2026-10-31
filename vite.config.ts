import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pagesBase = "/msms-puzzle/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? pagesBase : "/",
  plugins: [react()],
}));
