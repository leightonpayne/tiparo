import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const fontId = process.argv[2]?.trim();
const nextVersion = process.argv[3]?.trim();

if (!fontId || !nextVersion) {
  throw new Error("Usage: node scripts/set-archive-version.mjs <font-id> <short-hash>");
}

if (!/^[a-z0-9]+$/i.test(nextVersion)) {
  throw new Error("Archive version must be an alphanumeric short hash.");
}

const familyPath = path.join(repoRoot, "content", "fonts", fontId, "family.toml");
const familyText = await fs.readFile(familyPath, "utf8");
const lines = familyText.split(/\r?\n/);

let inSource = false;
let sourceStartIndex = -1;
let archiveLineIndex = -1;
let archiveVersionLineIndex = -1;

for (let index = 0; index < lines.length; index += 1) {
  const trimmed = lines[index].trim();

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    inSource = trimmed === "[source]";

    if (inSource) {
      sourceStartIndex = index;
    } else if (sourceStartIndex >= 0 && archiveVersionLineIndex === -1 && archiveLineIndex >= 0) {
      break;
    }

    continue;
  }

  if (!inSource) {
    continue;
  }

  if (trimmed.startsWith("archive =")) {
    archiveLineIndex = index;
  }

  if (trimmed.startsWith("archive_version =")) {
    archiveVersionLineIndex = index;
    break;
  }
}

if (sourceStartIndex === -1) {
  throw new Error(`Missing [source] section in ${familyPath}`);
}

if (archiveLineIndex === -1) {
  throw new Error(`Missing source.archive in ${familyPath}`);
}

if (archiveVersionLineIndex >= 0) {
  lines[archiveVersionLineIndex] = `archive_version = "${nextVersion}"`;
} else {
  lines.splice(archiveLineIndex + 1, 0, `archive_version = "${nextVersion}"`);
}

await fs.writeFile(familyPath, `${lines.join("\n").replace(/\n+$/, "\n")}`);
