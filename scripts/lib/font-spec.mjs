function stripInlineComment(line) {
  let result = "";
  let inString = false;
  let bracketDepth = 0;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const previous = index > 0 ? line[index - 1] : "";

    if (character === '"' && previous !== "\\") {
      inString = !inString;
      result += character;
      continue;
    }

    if (!inString) {
      if (character === "[") {
        bracketDepth += 1;
      } else if (character === "]") {
        bracketDepth = Math.max(bracketDepth - 1, 0);
      } else if (character === "#" && bracketDepth === 0) {
        break;
      }
    }

    result += character;
  }

  return result.trim();
}

function splitTopLevel(value) {
  const parts = [];
  let current = "";
  let inString = false;
  let bracketDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const previous = index > 0 ? value[index - 1] : "";

    if (character === '"' && previous !== "\\") {
      inString = !inString;
      current += character;
      continue;
    }

    if (!inString) {
      if (character === "[") {
        bracketDepth += 1;
      } else if (character === "]") {
        bracketDepth = Math.max(bracketDepth - 1, 0);
      } else if (character === "," && bracketDepth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }

    current += character;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function parseTomlValue(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed
      .slice(1, -1)
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();

    if (!inner) {
      return [];
    }

    return splitTopLevel(inner).map(parseTomlValue);
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

export function parseFamilySpec(source) {
  const root = {};
  let currentTarget = root;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = stripInlineComment(rawLine);

    if (!line) {
      continue;
    }

    if (line.startsWith("[") && line.endsWith("]")) {
      const sectionPath = line
        .slice(1, -1)
        .trim()
        .split(".")
        .map((part) => part.trim())
        .filter(Boolean);

      if (sectionPath.length === 0) {
        throw new Error(`Invalid section header: ${rawLine}`);
      }

      currentTarget = root;

      for (const segment of sectionPath) {
        if (
          typeof currentTarget[segment] !== "object" ||
          currentTarget[segment] === null ||
          Array.isArray(currentTarget[segment])
        ) {
          currentTarget[segment] = {};
        }

        currentTarget = currentTarget[segment];
      }

      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      throw new Error(`Invalid TOML assignment: ${rawLine}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);

    if (!key) {
      throw new Error(`Invalid TOML key: ${rawLine}`);
    }

    currentTarget[key] = parseTomlValue(value);
  }

  return root;
}

function normalizeStyleFile(file) {
  let normalized = file.replace(/\\/g, "/").replace(/^\.\/+/, "");

  if (normalized.startsWith("upstream/")) {
    normalized = normalized.slice("upstream/".length);
  }

  return normalized;
}

export function getRelativeUpstreamPath(familyId, file) {
  const normalized = normalizeStyleFile(file);
  return normalized.startsWith(`${familyId}/`)
    ? normalized.slice(familyId.length + 1)
    : normalized;
}

export function toStringArray(value, options = {}) {
  const { trim = true } = options;

  if (Array.isArray(value)) {
    return value
      .filter((entry) => typeof entry === "string")
      .map((entry) => (trim ? entry.trim() : entry))
      .filter((entry) => (trim ? Boolean(entry) : entry.length > 0));
  }

  if (typeof value === "string") {
    if (!trim) {
      return value.length > 0 ? [value] : [];
    }

    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
}

export function getStyleEntries(spec, specPath) {
  const styleTables = spec.style ?? {};

  if (
    typeof styleTables !== "object" ||
    styleTables === null ||
    Array.isArray(styleTables)
  ) {
    throw new Error(`Expected [style.*] tables in ${specPath}`);
  }

  return Object.entries(styleTables).map(([styleId, value]) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`Expected [style.${styleId}] table in ${specPath}`);
    }

    return {
      id: styleId,
      name: typeof value.name === "string" ? value.name.trim() : styleId,
      file: typeof value.file === "string" ? value.file.trim() : "",
      index:
        typeof value.index === "number" && Number.isInteger(value.index)
          ? value.index
          : undefined,
    };
  });
}
