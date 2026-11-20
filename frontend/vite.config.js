import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  // Only scan the app entry: .claude/skills ships its own demo .html files that are not part of the app.
  optimizeDeps: { entries: ["index.html"] },
});
