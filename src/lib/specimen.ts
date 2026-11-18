import type { FontEntry } from "@/data/fonts";

const previewSize = 52;

function countVisibleChars(text: string) {
  return Array.from(text.replace(/\s/g, "")).length;
}

function maxTokenLength(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .reduce((max, token) => Math.max(max, Array.from(token).length), 0);
}

function isGlyphHeavyText(text: string) {
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
  let text = requestedText.trim() || font.family;
  const rules = font.specimen;

  if (!rules) {
    return text;
  }

  if (rules.forceLowercase) {
    text = text.toLocaleLowerCase();
  }

  if (rules.punctuationReplacement) {
    text = text.replace(/\p{P}/gu, rules.punctuationReplacement);
  }

  if (rules.supportedGlyphs && rules.supportedGlyphs.length > 0) {
    const supported = new Set(
      rules.supportedGlyphs.flatMap((glyph) => Array.from(glyph)),
    );
    text = Array.from(text)
      .filter((char) => supported.has(char))
      .join("");
  }

  if (rules.unsupportedGlyphs && rules.unsupportedGlyphs.length > 0) {
    const unsupported = new Set(
      rules.unsupportedGlyphs.flatMap((glyph) => Array.from(glyph)),
    );
    text = Array.from(text)
      .filter((char) => !unsupported.has(char))
      .join("");
  }

  return text;
}

export function getListSpecimenMetrics(font: FontEntry, requestedText: string) {
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

export function getDetailSpecimenMetrics(
  font: FontEntry,
  requestedText: string,
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

  return {
    text,
    glyphHeavy,
    size: Math.max(size, glyphHeavy ? 38 : 44),
  };
}
