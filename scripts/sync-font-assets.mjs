import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getFontFilePath,
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

function getRequestedFontIds(availableFontIds) {
  if (requestedFontIds.length === 0 || requestedFontIds.includes("--all")) {
    return availableFontIds;
  }

  return requestedFontIds;
}

async function syncFont(fontId) {
  const specPath = path.join(contentFontsDir, fontId, "family.json");
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
    new Set(styles.map((style) => style.file)),
  );

  for (const relativePath of requiredPaths) {
    const sourcePath = path.join(localUpstreamPath, ...relativePath.split("/"));

    if (!(await fileExists(sourcePath))) {
      throw new Error(`Missing upstream asset for "${fontId}": ${relativePath}`);
    }
    await getFontFilePath(localUpstreamPath, relativePath);
  }

  // Keep staging on the same filesystem, outside the discoverable font folders.
  const temporaryDirectory = await fs.mkdtemp(path.join(repoRoot, "content", ".font-sync-"));
  const stagedFontPath = path.join(temporaryDirectory, "next");
  const previousFontPath = path.join(temporaryDirectory, "previous");
  let backupPending = false;

  try {
    await fs.mkdir(stagedFontPath);

    for (const relativePath of requiredPaths) {
      const destinationPath = path.join(stagedFontPath, relativePath);
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.copyFile(
        path.join(localUpstreamPath, ...relativePath.split("/")),
        destinationPath,
      );
    }

    await fs.copyFile(specPath, path.join(stagedFontPath, "family.json"));
    await fs.rename(trackedFontPath, previousFontPath);
    backupPending = true;
    await fs.rename(stagedFontPath, trackedFontPath);
    backupPending = false;
  } catch (error) {
    if (backupPending) {
      await fs.rename(previousFontPath, trackedFontPath);
      backupPending = false;
    }

    throw error;
  } finally {
    // If restoring the original directory fails, retain its backup for recovery.
    if (!backupPending) {
      await fs.rm(temporaryDirectory, { recursive: true, force: true });
    }
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
