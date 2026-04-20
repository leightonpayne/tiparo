import type { FontEntry } from "@/data/fonts";

const loadedFontModes = new Map<string, "preview" | "full">();

function escapeCssString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getFormatSuffix(format?: string) {
  if (!format || format === "collection") {
    return "";
  }

  return ` format("${format}")`;
}

function getManualFaceFamilyName(font: FontEntry, faceIndex: number) {
  return `tiparo-${font.id}-${faceIndex}`;
}

function normalizeDisplayStyleToken(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function getConfiguredFaceIndex(font: FontEntry) {
  if (font.source.type !== "local") {
    return -1;
  }

  const displayStyle = normalizeDisplayStyleToken(font.display?.style);

  if (!displayStyle) {
    return -1;
  }

  return font.source.faces.findIndex((face) => {
    const faceId = normalizeDisplayStyleToken(face.id);
    const faceName = normalizeDisplayStyleToken(face.name);
    return faceId === displayStyle || faceName === displayStyle;
  });
}

function getDefaultFaceIndex(font: FontEntry) {
  if (font.source.type !== "local") {
    return 0;
  }

  const configuredFaceIndex = getConfiguredFaceIndex(font);

  if (configuredFaceIndex >= 0) {
    return configuredFaceIndex;
  }

  return Math.max(
    font.source.faces.findIndex(
      (face) => (face.style ?? "normal") === "normal" && face.weight === "400",
    ),
    0,
  );
}

export function getFontPreviewFamilyName(font: FontEntry) {
  return font.source.type === "local"
    ? getManualFaceFamilyName(font, getDefaultFaceIndex(font))
    : font.family;
}

export function getManualStyleFontFamilyName(font: FontEntry, faceIndex: number) {
  return getManualFaceFamilyName(font, faceIndex);
}

function buildLocalFontRule(font: FontEntry) {
  if (font.source.type !== "local") {
    return "";
  }

  return font.source.faces
    .map(
      (face, faceIndex) => `@font-face {
  font-family: "${escapeCssString(getManualFaceFamilyName(font, faceIndex))}";
  src: url("${face.path}")${getFormatSuffix(face.format)};
  font-display: swap;
  font-style: ${face.style ?? "normal"};
  font-weight: ${face.weight};
}`,
    )
    .join("\n");
}

function buildPreviewFontRule(font: FontEntry) {
  if (font.source.type !== "local") {
    return "";
  }

  const previewFaceIndex = getDefaultFaceIndex(font);
  const previewFace = font.source.faces[previewFaceIndex];

  if (!previewFace) {
    return "";
  }

  return `@font-face {
  font-family: "${escapeCssString(getManualFaceFamilyName(font, previewFaceIndex))}";
  src: url("${previewFace.path}")${getFormatSuffix(previewFace.format)};
  font-display: swap;
  font-style: ${previewFace.style ?? "normal"};
  font-weight: ${previewFace.weight};
}`;
}

function ensureLocalFontStyle(font: FontEntry, mode: "preview" | "full") {
  const currentMode = loadedFontModes.get(font.id);

  if (currentMode === "full" || currentMode === mode) {
    return;
  }

  const selector = `style[data-tiparo-font="${CSS.escape(font.id)}"]`;
  const existing = document.head.querySelector<HTMLStyleElement>(selector);
  const style = existing ?? document.createElement("style");

  style.dataset.tiparoFont = font.id;
  style.textContent =
    mode === "full" ? buildLocalFontRule(font) : buildPreviewFontRule(font);

  if (!existing) {
    document.head.append(style);
  }

  loadedFontModes.set(font.id, mode);
}

export function ensureFontPreviewLoaded(font: FontEntry) {
  if (typeof document === "undefined") {
    return;
  }

  if (font.source.type === "css") {
    if (loadedFontModes.has(font.id)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = font.source.url;
    link.dataset.tiparoFont = font.id;
    document.head.append(link);
    loadedFontModes.set(font.id, "full");
    return;
  }

  ensureLocalFontStyle(font, "preview");
}

export function ensureFontLoaded(font: FontEntry) {
  if (typeof document === "undefined") {
    return;
  }

  if (font.source.type === "css") {
    ensureFontPreviewLoaded(font);
    return;
  }

  ensureLocalFontStyle(font, "full");
}

export function ensureFontPreviewsLoaded(fonts: FontEntry[]) {
  fonts.forEach(ensureFontPreviewLoaded);
}
