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

function sanitizeSpecimenText(font: FontEntry, text: string) {
  const rules = font.specimen;

  if (!rules) {
    return {
      text,
      adjusted: false,
      note: undefined,
    };
  }

  let nextText = text;
  let adjusted = false;

  if (rules.forceLowercase) {
    const lowercased = nextText.toLocaleLowerCase();
    adjusted ||= lowercased !== nextText;
    nextText = lowercased;
  }

  if (rules.punctuationReplacement) {
    const replaced = nextText.replace(/\p{P}/gu, rules.punctuationReplacement);
    adjusted ||= replaced !== nextText;
    nextText = replaced;
  }

  if (rules.supportedGlyphs && rules.supportedGlyphs.length > 0) {
    const supported = new Set(rules.supportedGlyphs.flatMap((glyph) => Array.from(glyph)));
    const filtered = Array.from(nextText)
      .filter((char) => supported.has(char))
      .join("");
    adjusted ||= filtered !== nextText;
    nextText = filtered;
  }

  if (rules.unsupportedGlyphs && rules.unsupportedGlyphs.length > 0) {
    const unsupported = new Set(rules.unsupportedGlyphs.flatMap((glyph) => Array.from(glyph)));
    const filtered = Array.from(nextText)
      .filter((char) => !unsupported.has(char))
      .join("");
    adjusted ||= filtered !== nextText;
    nextText = filtered;
  }

  return {
    text: nextText,
    adjusted,
    note: rules.note,
  };
}

export function getSpecimenText(font: FontEntry, requestedText: string) {
  const normalizedRequested = requestedText.trim();

  const baseText = normalizedRequested || font.family;

  return sanitizeSpecimenText(font, baseText);
}

export function getGridSpecimenMetrics(
  font: FontEntry,
  requestedText: string,
  previewSize: number,
) {
  const specimen = getSpecimenText(font, requestedText);
  const glyphHeavy = isGlyphHeavyText(specimen.text);
  const visibleChars = countVisibleChars(specimen.text);
  const longestToken = maxTokenLength(specimen.text);

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
    text: specimen.text,
    adjusted: specimen.adjusted,
    note: specimen.note,
    glyphHeavy,
    size: Math.max(size, glyphHeavy ? 24 : 30),
  };
}

export function getListSpecimenMetrics(
  font: FontEntry,
  requestedText: string,
  previewSize: number,
) {
  const specimen = getSpecimenText(font, requestedText);
  const glyphHeavy = isGlyphHeavyText(specimen.text);
  const visibleChars = countVisibleChars(specimen.text);

  let size = Math.min(Math.max(previewSize + 6, 34), 82);

  if (glyphHeavy) {
    size = Math.min(size, 68);
  }

  if (visibleChars > 64) {
    size -= 4;
  }

  return {
    text: specimen.text,
    adjusted: specimen.adjusted,
    note: specimen.note,
    glyphHeavy,
    size: Math.max(size, glyphHeavy ? 30 : 34),
  };
}

export function getDialogSpecimenMetrics(
  font: FontEntry,
  requestedText: string,
  previewSize: number,
) {
  const specimen = getSpecimenText(font, requestedText);
  const glyphHeavy = isGlyphHeavyText(specimen.text);
  const visibleChars = countVisibleChars(specimen.text);
  const longestToken = maxTokenLength(specimen.text);

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
    text: specimen.text,
    adjusted: specimen.adjusted,
    note: specimen.note,
    glyphHeavy,
    size: Math.max(size, glyphHeavy ? 38 : 44),
  };
}
