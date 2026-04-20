import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getRelativeUpstreamPath,
  getStyleEntries,
  parseFamilySpec,
} from "./lib/font-spec.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const contentFontsDir = path.join(repoRoot, "content", "fonts");
const localUpstreamsDir = path.join(repoRoot, "content", "upstreams");
const requestedFontIds = process.argv.slice(2);

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getAvailableFontIds() {
  const entries = await fs.readdir(contentFontsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function copyPath(sourcePath, destinationPath) {
  const stats = await fs.stat(sourcePath);

  if (stats.isDirectory()) {
    await fs.mkdir(destinationPath, { recursive: true });
    const entries = await fs.readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      await copyPath(
        path.join(sourcePath, entry.name),
        path.join(destinationPath, entry.name),
      );
    }

    return;
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
}

async function clearTrackedFontDirectory(fontDirectoryPath) {
  const entries = await fs.readdir(fontDirectoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "family.toml") {
      continue;
    }

    await fs.rm(path.join(fontDirectoryPath, entry.name), {
      recursive: true,
      force: true,
    });
  }
}

function getRequestedFontIds(availableFontIds) {
  if (requestedFontIds.length === 0 || requestedFontIds.includes("--all")) {
    return availableFontIds;
  }

  return requestedFontIds;
}

async function syncFont(fontId) {
  const specPath = path.join(contentFontsDir, fontId, "family.toml");
  const localUpstreamPath = path.join(localUpstreamsDir, fontId);
  const trackedFontPath = path.join(contentFontsDir, fontId);

  if (!(await fileExists(specPath))) {
    throw new Error(`Missing family spec: ${specPath}`);
  }

  if (!(await fileExists(localUpstreamPath))) {
    throw new Error(`Missing local upstream directory: ${localUpstreamPath}`);
  }

  const specText = await fs.readFile(specPath, "utf8");
  const spec = parseFamilySpec(specText);
  const styles = getStyleEntries(spec, specPath);
  const requiredPaths = Array.from(
    new Set(styles.map((style) => getRelativeUpstreamPath(fontId, style.file))),
  );

  await fs.mkdir(trackedFontPath, { recursive: true });
  await clearTrackedFontDirectory(trackedFontPath);

  for (const relativePath of requiredPaths) {
    const sourcePath = path.join(localUpstreamsDir, fontId, ...relativePath.split("/"));
    const destinationPath = path.join(trackedFontPath, ...relativePath.split("/"));

    if (!(await fileExists(sourcePath))) {
      throw new Error(`Missing upstream asset for "${fontId}": ${relativePath}`);
    }

    await copyPath(sourcePath, destinationPath);
  }

  console.log(
    `Synced ${fontId}: ${styles.length} preview files.`,
  );
}

const availableFontIds = await getAvailableFontIds();
const fontIds = getRequestedFontIds(availableFontIds);

for (const fontId of fontIds) {
  if (!availableFontIds.includes(fontId)) {
    throw new Error(`Unknown font id: ${fontId}`);
  }

  await syncFont(fontId);
}
