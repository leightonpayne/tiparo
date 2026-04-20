import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getRelativeUpstreamPath,
  getStyleEntries,
  parseFamilySpec,
  toStringArray,
} from "./lib/font-spec.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const contentFontsDir = path.join(repoRoot, "content", "fonts");
const archiveConfigPath = path.join(repoRoot, "content", "archive-config.json");
const outputPath = path.join(repoRoot, "src", "data", "generated-font-library.ts");

function isExternalPath(value) {
  return /^(?:https?:)?\/\//.test(value) || value.startsWith("/");
}

function toImportName(value) {
  return value.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function toRepoRelativePath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function getFileExtension(filePath) {
  return filePath.split(".").pop()?.toLowerCase() ?? "";
}

function detectFormat(filePath) {
  const extension = getFileExtension(filePath);

  if (extension === "ttf") {
    return "truetype";
  }

  if (extension === "otf") {
    return "opentype";
  }

  if (extension === "ttc") {
    return "collection";
  }

  return extension;
}

function inferWeight(name, styleId) {
  const match = `${name} ${styleId}`.match(/\b(\d{3})\b/);
  return match?.[1] ?? "400";
}

function inferFontStyle(name, styleId) {
  return /italic/i.test(`${name} ${styleId}`) ? "italic" : "normal";
}

function getDesignerEntries(details) {
  const names = toStringArray(details.designer);
  const uniqueNames = names.filter(
    (name, index) => names.findIndex((candidate) => candidate === name) === index,
  );
  const urls = toStringArray(details.designer_url);

  return uniqueNames.map((name, index) => ({
    name,
    url: urls[index] || undefined,
  }));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function raw(code) {
  return { __raw: code };
}

async function readArchiveConfig() {
  const configText = await fs.readFile(archiveConfigPath, "utf8");
  const config = JSON.parse(configText);
  const baseUrl = typeof config.baseUrl === "string" ? config.baseUrl.trim() : "";

  if (!/^https?:\/\//.test(baseUrl)) {
    throw new Error(`Invalid archive baseUrl in ${archiveConfigPath}`);
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
  };
}

function serialize(value, indent = 0) {
  const padding = "  ".repeat(indent);
  const nextPadding = "  ".repeat(indent + 1);

  if (value && typeof value === "object" && "__raw" in value) {
    return value.__raw;
  }

  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    return `[\n${value
      .map((entry) => `${nextPadding}${serialize(entry, indent + 1)},`)
      .join("\n")}\n${padding}]`;
  }

  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined);

  if (entries.length === 0) {
    return "{}";
  }

  return `{\n${entries
    .map(
      ([key, entry]) =>
        `${nextPadding}${JSON.stringify(key)}: ${serialize(entry, indent + 1)},`,
    )
    .join("\n")}\n${padding}}`;
}

async function buildGeneratedLibrary() {
  const archiveConfig = await readArchiveConfig();
  const familyEntries = await fs.readdir(contentFontsDir, { withFileTypes: true });
  const families = familyEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const assetImports = new Map();
  const fontLibraryEntries = [];

  function getOrCreateAssetImport(filePath, prefix) {
    const existing = assetImports.get(filePath);

    if (existing) {
      return existing;
    }

    const importName = `${prefix}_${toImportName(toRepoRelativePath(filePath))}`;
    const relativeImportPath = path
      .relative(path.dirname(outputPath), filePath)
      .split(path.sep)
      .join("/");

    assetImports.set(filePath, {
      importName,
      importPath: `${relativeImportPath}?url`,
    });

    return assetImports.get(filePath);
  }

  for (const familyId of families) {
    const specPath = path.join(contentFontsDir, familyId, "family.toml");

    if (!(await fileExists(specPath))) {
      continue;
    }

    const specText = await fs.readFile(specPath, "utf8");
    const spec = parseFamilySpec(specText);
    const details = spec.details ?? {};
    const source = spec.source ?? {};
    const display = spec.display ?? {};
    const designers = getDesignerEntries(details);
    const styles = getStyleEntries(spec, specPath);

    if (styles.length === 0) {
      continue;
    }

    const faces = [];

    for (const style of styles) {
      const relativeUpstreamPath = getRelativeUpstreamPath(familyId, style.file);
      const assetDiskPath = path.join(contentFontsDir, familyId, ...relativeUpstreamPath.split("/"));

      if (!(await fileExists(assetDiskPath))) {
        throw new Error(`Missing font asset for "${familyId}": ${style.file}`);
      }

      const assetImport = getOrCreateAssetImport(assetDiskPath, "font");

      faces.push({
        id: style.id,
        name: style.name,
        file: style.file,
        path: raw(assetImport.importName),
        weight: inferWeight(style.name, style.id),
        style: inferFontStyle(style.name, style.id),
        format: detectFormat(style.file),
        collectionIndex: style.index,
      });
    }

    let downloadValue;

    if (typeof source.archive === "string" && source.archive.trim()) {
      const archive = source.archive.trim();

      if (isExternalPath(archive)) {
        downloadValue = archive;
      } else {
        const archiveVersion =
          typeof source.archive_version === "string" ? source.archive_version.trim() : "";

        if (!archiveVersion) {
          throw new Error(`Missing source.archive_version for "${familyId}" in ${specPath}`);
        }

        downloadValue = `${archiveConfig.baseUrl}/${archiveVersion.replace(
          /^\/+|\/+$/g,
          "",
        )}/${archive.replace(/^\/+/, "")}`;
      }
    }

    const familyEntry = {
      id: familyId,
      family: details.name?.trim() || familyId,
      designer: designers.map(({ name }) => name).join(", "),
      designerUrl: designers.length === 1 ? designers[0]?.url : undefined,
      designers,
      foundry: details.foundry?.trim() ?? "",
      foundryUrl: details.foundry_url?.trim() ?? undefined,
      license: details.license?.trim() ?? "",
      licenseUrl: details.license_url?.trim() ?? undefined,
      copyright: details.copyright?.trim() ?? "",
      source: {
        type: "local",
        faces,
      },
      links: {
        source: source.repository,
        official: details.website ?? source.repository,
        download: downloadValue,
      },
      display: {
        style: display.style?.trim() || undefined,
      },
      upstream: {
        projectUrl: source.repository ?? null,
        downloadUrl: downloadValue ?? null,
        version: source.commit ?? null,
      },
    };

    fontLibraryEntries.push(familyEntry);
  }

  fontLibraryEntries.sort((left, right) => left.family.localeCompare(right.family));

  const importLines = [
    'import type { FontEntry } from "./fonts";',
    ...Array.from(assetImports.values()).map(
      ({ importName, importPath }) => `import ${importName} from ${JSON.stringify(importPath)};`,
    ),
  ];

  const output = `// This file is generated by scripts/generate-font-manifest.mjs.
// Do not edit manually.

${importLines.join("\n")}

export const fontLibrary: FontEntry[] = ${serialize(fontLibraryEntries)};
`;

  await fs.writeFile(outputPath, output);
}

await buildGeneratedLibrary();
