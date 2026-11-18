import { promises as fs } from "node:fs";
import path from "node:path";

export function parseFamilySpec(source) {
  const spec = JSON.parse(source);
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
    throw new Error("Expected a family JSON object.");
  }
  return spec;
}

export function toStringArray(value, { trim = true } = {}) {
  return (Array.isArray(value) ? value : [value])
    .filter((entry) => typeof entry === "string")
    .map((entry) => (trim ? entry.trim() : entry))
    .filter((entry) => entry.length > 0);
}

export function getStyleEntries(spec, specPath) {
  const styles = spec.style ?? {};
  if (!styles || typeof styles !== "object" || Array.isArray(styles)) {
    throw new Error(`Expected a style object in ${specPath}`);
  }

  return Object.entries(styles).map(([id, value]) => {
    const file = value?.file;
    if (
      !file || typeof file !== "string" || file.includes("\\") ||
      path.posix.isAbsolute(file) || /^[a-z]:/i.test(file) ||
      file.split("/").some((segment) => !segment || segment === "." || segment === "..")
    ) {
      throw new Error(`Expected a family-relative file path for style "${id}" in ${specPath}`);
    }

    return { id, name: value.name?.trim() || id, file };
  });
}

export async function getFontFilePath(directory, file) {
  const filePath = path.join(directory, file);
  const [realDirectory, realFile] = await Promise.all([
    fs.realpath(directory),
    fs.realpath(filePath),
  ]);
  const relative = path.relative(realDirectory, realFile);
  if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Font asset escapes its family directory: ${file}`);
  }
  if (!(await fs.stat(filePath)).isFile()) {
    throw new Error(`Expected a font file: ${file}`);
  }
  return filePath;
}
