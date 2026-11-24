import assets from "./generated-mockup-assets.json" with { type: "json" };
import type { MockupSceneId } from "@/lib/mockup";
import type { MockupSurface } from "@/lib/mockup-projection";
import type { MockupWarp } from "@/lib/mockup-warp";
import { agitpropDesigns, type AgitpropDesign } from "./agitprop-designs.ts";

export type MockupPage = AgitpropDesign & {
  format: "portrait" | "landscape" | "strip";
  footer: string;
  surface: MockupSurface;
  plane: [number, number];
  warp?: MockupWarp;
  /** Alpha mask in photograph coordinates, including the PSD's torn edges. */
  mask: string;
};

export type MockupScene = {
  id: string;
  design: MockupSceneId;
  label: string;
  alt: string;
  sourceUrl: string;
  sourceArchive: string;
  sourceDocument?: string;
  image: string;
  photo: { author: string; url: string; width: number; height: number };
  crop: { x: number; y: number; width: number; height: number };
  pages: MockupPage[];
};

export const mockupScenes: MockupScene[] = assets.map((asset) => {
  const designs = agitpropDesigns[asset.id];
  if (!designs?.length) throw new Error(`Missing campaign design for ${asset.id}`);
  const label = asset.archive
    .replace(/^[^_]+_/, "")
    .replace(/\.zip$/, "")
    .replaceAll("_", " ");
  const sceneNumber = asset.id.match(/-(\d+)$/)?.[1];
  const sceneLabel = sceneNumber ? `${label} — ${sceneNumber}` : label;
  // Frame the visible print with some street context, keeping small posters
  // legible at the canvas's initial zoom. Off-camera copies stay clipped.
  const points = asset.pages.flatMap(({ surface }) => surface);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const left = Math.max(0, Math.min(...xs));
  const top = Math.max(0, Math.min(...ys));
  const right = Math.min(asset.width, Math.max(...xs));
  const bottom = Math.min(asset.height, Math.max(...ys));
  const padding = Math.max(right - left, bottom - top) * 0.16;
  const cropX = Math.floor(Math.max(0, left - padding));
  const cropY = Math.floor(Math.max(0, top - padding));

  return {
    id: asset.id,
    design: "poster",
    label: sceneLabel,
    alt: `${sceneLabel} with ${designs[0].headline.replaceAll("\n", " ")} lettering from ${designs[0].source.author} in the selected typeface.`,
    sourceUrl: designs[0].source.url,
    sourceArchive: asset.archive,
    sourceDocument: "document" in asset ? String(asset.document) : undefined,
    image: `local/${asset.id}.webp`,
    photo: {
      author: "Mockups Design",
      url: "https://mockups-design.com/",
      width: asset.width,
      height: asset.height,
    },
    crop: {
      x: cropX,
      y: cropY,
      width: Math.ceil(Math.min(asset.width, right + padding)) - cropX,
      height: Math.ceil(Math.min(asset.height, bottom + padding)) - cropY,
    },
    pages: asset.pages.map((page, index): MockupPage => {
      const design = designs[index % designs.length];
      const plane = page.plane as [number, number];
      const landscape = plane[0] / plane[1] > 1.25;
      const strip = plane[0] / plane[1] > 3;
      return {
        ...design,
        format: strip ? "strip" : landscape ? "landscape" : "portrait",
        headline: strip ? design.headline.replaceAll("\n", " ") : design.headline,
        kicker: strip ? "" : design.kicker,
        body: strip ? "" : design.body,
        footer: `${design.source.author} · ${design.source.year}`,
        headlineSize: strip
          ? Math.min(design.headlineSize ?? 9, 9)
          : landscape
            ? Math.min(design.headlineSize ?? 18, 18)
            : design.headlineSize,
        surface: page.surface as unknown as MockupSurface,
        plane,
        warp: "warp" in page ? page.warp as unknown as MockupWarp : undefined,
        mask: page.mask,
      };
    }),
  };
});
