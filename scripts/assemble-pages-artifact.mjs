import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const appDistDir = path.join(repoRoot, "dist");
const docsSiteDir = path.join(repoRoot, "site");
const outputDocsDir = path.join(appDistDir, "docs");

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(appDistDir))) {
  throw new Error(`Missing app build output: ${appDistDir}`);
}

if (!(await exists(docsSiteDir))) {
  throw new Error(`Missing docs build output: ${docsSiteDir}`);
}

await fs.rm(outputDocsDir, { recursive: true, force: true });
await fs.mkdir(path.dirname(outputDocsDir), { recursive: true });
await fs.cp(docsSiteDir, outputDocsDir, { recursive: true });

console.log(`Assembled GitHub Pages artifact with docs at ${path.relative(repoRoot, outputDocsDir)}`);
