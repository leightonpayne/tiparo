import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function resolveBasePath() {
  const explicitBase = process.env.VITE_BASE_PATH;

  if (explicitBase) {
    return explicitBase.endsWith("/") ? explicitBase : `${explicitBase}/`;
  }

  if (process.env.GITHUB_ACTIONS !== "true") {
    return "/";
  }

  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";

  if (!repository || repository.endsWith(".github.io")) {
    return "/";
  }

  return `/${repository}/`;
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
