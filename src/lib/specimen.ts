import type { FontEntry } from "@/data/fonts";

function countVisibleChars(text: string) {
  return Array.from(text.replace(/\s/g, "")).length;
}

function maxTokenLength(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .reduce((max, token) => Math.max(max, Array.from(token).length), 0);
}

export function isGlyphHeavyText(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    return false;
  }

  const chars = Array.from(trimmed.replace(/\s/g, ""));

  if (chars.length === 0) {
    return false;
  }

  const nonLatinOrNumericChars = chars.filter(
    (char) => !/[\p{Script=Latin}\p{Number}]/u.test(char),
  ).length;

  return (
    trimmed.includes("\n") ||
    nonLatinOrNumericChars / chars.length > 0.32 ||
    maxTokenLength(trimmed) > 18
  );
}

export function getSpecimenText(font: FontEntry, requestedText: string) {
  const normalizedRequested = requestedText.trim();

  if (normalizedRequested) {
    return normalizedRequested;
  }

  return font.family;
}

export function getGridSpecimenMetrics(
  font: FontEntry,
  requestedText: string,
  previewSize: number,
) {
  const text = getSpecimenText(font, requestedText);
  const glyphHeavy = isGlyphHeavyText(text);
  const visibleChars = countVisibleChars(text);
  const longestToken = maxTokenLength(text);

  let size = Math.min(Math.max(previewSize - 4, 34), 60);

  if (glyphHeavy) {
    size = Math.min(size, 44);
  }

  if (visibleChars > 42) {
    size -= 4;
  }

  if (visibleChars > 72) {
    size -= 5;
  }

  if (longestToken > 14) {
    size -= 3;
  }

  return {
    text,
    glyphHeavy,
    size: Math.max(size, glyphHeavy ? 24 : 30),
  };
}

export function getListSpecimenMetrics(
  font: FontEntry,
  requestedText: string,
  previewSize: number,
) {
  const text = getSpecimenText(font, requestedText);
  const glyphHeavy = isGlyphHeavyText(text);
  const visibleChars = countVisibleChars(text);

  let size = Math.min(Math.max(previewSize + 6, 34), 82);

  if (glyphHeavy) {
    size = Math.min(size, 68);
  }

  if (visibleChars > 64) {
    size -= 4;
  }

  return {
    text,
    glyphHeavy,
    size: Math.max(size, glyphHeavy ? 30 : 34),
  };
}

export function getDialogSpecimenMetrics(
  font: FontEntry,
  requestedText: string,
  previewSize: number,
) {
  const text = getSpecimenText(font, requestedText);
  const glyphHeavy = isGlyphHeavyText(text);
  const visibleChars = countVisibleChars(text);
  const longestToken = maxTokenLength(text);

  let size = Math.min(Math.max(previewSize + 18, 58), 140);

  if (glyphHeavy) {
    size = Math.min(size, 104);
  }

  if (visibleChars > 26) {
    size -= 6;
  }

  if (visibleChars > 40) {
    size -= 8;
  }

  if (visibleChars > 56) {
    size -= 8;
  }

  if (longestToken > 12) {
    size -= 4;
  }

  if (longestToken > 18) {
    size -= 6;
  }

  return { text, glyphHeavy, size: Math.max(size, glyphHeavy ? 38 : 44) };
}
