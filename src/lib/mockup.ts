import type { FontEntry } from "../data/fonts.ts";
import { getSpecimenText } from "./specimen.ts";

export type MockupSceneId =
  | "programme"
  | "placard"
  | "poster"
  | "book"
  | "study"
  | "artprint"
  | "broadside"
  | "reading";
export type MockupFace = FontEntry["faces"][number];

export type MockupIconId =
  | "earth"
  | "housing"
  | "labour"
  | "solidarity"
  | "study"
  | "time"
  | "assembly"
  | "tools"
  | "harvest"
  | "equality"
  | "organise"
  | "nature"
  | "art"
  | "resistance";

const headlineWeights: Record<MockupSceneId, number> = {
  programme: 600,
  placard: 600,
  poster: 700,
  book: 500,
  study: 600,
  artprint: 700,
  broadside: 500,
  reading: 600,
};

function isDisplayFace(face: MockupFace) {
  return /display/i.test(`${face.id} ${face.name}`);
}

function nearestFace(
  faces: MockupFace[],
  weight: number,
  fallback: MockupFace,
) {
  return faces.reduce((closest, face) => {
    const distance = Math.abs(Number(face.weight) - weight);
    const closestDistance = Math.abs(Number(closest.weight) - weight);
    return distance < closestDistance ||
      (distance === closestDistance &&
        Number(face.weight) > Number(closest.weight))
      ? face
      : closest;
  }, faces[0] ?? fallback);
}

export function resolveMockupFaces(
  font: FontEntry,
  scene: MockupSceneId,
): { headline: MockupFace; body: MockupFace } {
  const fallback =
    font.faces.find((face) => face.fontFamily === font.previewFamily) ??
    font.faces[0];
  const normal = font.faces.filter((face) => face.style === "normal");
  const text = normal.filter((face) => !isDisplayFace(face));
  const preferred = normal.filter(isDisplayFace);

  return {
    headline: nearestFace(
      preferred.length ? preferred : normal,
      headlineWeights[scene],
      fallback,
    ),
    body: nearestFace(text, 400, fallback),
  };
}

export function getMockupText(
  font: FontEntry,
  requested: string,
  fallback: string,
) {
  for (const value of [requested, fallback]) {
    if (!value.trim()) continue;
    // Line breaks are layout, even when the font's supported-glyph list omits them.
    const text = value
      .trim()
      .split(/\r\n?|\n/)
      .map((line) => (line.trim() ? getSpecimenText(font, line) : ""))
      .join("\n");
    if (text.trim()) return text;
  }
  return "";
}
