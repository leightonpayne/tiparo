import { useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";

import type { FontEntry } from "@/data/fonts";
import type { MockupPage } from "@/data/mockup-scenes";
import { getMockupText, resolveMockupFaces } from "@/lib/mockup";
import { getMockupSurfaceTransform } from "@/lib/mockup-projection";
import { fitMockupPrint } from "@/lib/mockup-print-fit";
import { getMockupWarpTiles } from "@/lib/mockup-warp";
import { getMockupRenderQuality } from "@/lib/mockup-render-quality";

export function MockupPrint({
  font,
  page,
  faces,
  displayScale = 1,
  pixelRatio = 1,
}: {
  font: FontEntry;
  page: MockupPage;
  faces: ReturnType<typeof resolveMockupFaces>;
  /** CSS pixels per photograph pixel, including the canvas zoom band. */
  displayScale?: number;
  pixelRatio?: number;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const projectionRef = useRef<HTMLDivElement>(null);
  const { renderScale, warpTolerance } = useMemo(
    () => getMockupRenderQuality(page, displayScale, pixelRatio),
    [page, displayScale, pixelRatio],
  );
  const width = page.plane[0] * renderScale;
  const height = page.plane[1] * renderScale;
  const tiles = useMemo(() => page.warp
    ? getMockupWarpTiles(page.warp, page.surface, width, height, warpTolerance)
    : undefined, [page, width, height, warpTolerance]);
  const text = (value: string) => getMockupText(font, value, "");
  const faceStyle = (face: typeof faces.headline): CSSProperties => ({
    fontFamily: `"${face.fontFamily}", var(--font-sans)`,
    fontWeight: face.weight,
    fontStyle: face.style,
    fontSynthesis: "none",
  });

  useLayoutEffect(() => {
    const print = printRef.current;
    if (!print) return;
    let disposed = false;
    const fit = () => {
      if (disposed) return;
      fitMockupPrint(print);
      // Fit only the original print plane. Zoom changes rendering resolution,
      // never the available space, line sizes, or selected quotation.
      for (const property of ["--mockup-fit", "--headline-fit"]) {
        projectionRef.current?.style.setProperty(property, print.style.getPropertyValue(property));
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(print);
    document.fonts.ready.then(fit);
    document.fonts.addEventListener("loadingdone", fit);
    return () => {
      disposed = true;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", fit);
    };
  }, [font, page]);

  const paletteStyle = {
    "--poster-paper": page.palette.paper,
    "--poster-ink": page.palette.ink,
    "--poster-accent": page.palette.accent,
    "--poster-headline-size": `${page.headlineSize ?? 26}cqw`,
    "--poster-body-size": `${page.bodySize ?? 7}cqw`,
    "--mockup-render-scale": renderScale,
    ...(page.inlineInset === undefined ? {} : { "--poster-inset-inline": `${page.inlineInset}%` }),
  } as CSSProperties;
  const headline = text(page.headline);
  const content = (
    <>
      <div className="mockup-print-main">
        <blockquote className="mockup-print-copy" cite={page.source.url}>
          <h4 style={faceStyle(page.layout === "statement" ? faces.body : faces.headline)}>
            {page.layout !== "statement" && page.format !== "strip"
              ? headline.split("\n").map((line, index) => (
                  <span
                    key={index}
                    data-accent={page.accentLine === index || undefined}
                    style={{ "--line-scale": page.lineSizes?.[index] ?? 1 } as CSSProperties}
                  >
                    {line}
                  </span>
                ))
              : headline}
          </h4>
          {page.body && (
            <p
              className="mockup-print-body"
              style={page.layout === "contrast" ? faceStyle(faces.headline) : undefined}
            >
              {text(page.body)}
            </p>
          )}
        </blockquote>
      </div>
      <div className="mockup-print-colophon">
        <p className="mockup-print-footer">{text(page.footer)}</p>
        {page.kicker && <p className="mockup-print-kicker">{text(page.kicker)}</p>}
      </div>
    </>
  );
  const surfaceProps = {
    "data-layout": page.layout,
    "data-format": page.format,
    "data-placement": page.placement,
  };
  const dimensions = { width, height };

  return (
    <div
      className={`mockup-print-projection${tiles ? " mockup-warp" : ""}`}
      ref={projectionRef}
      style={paletteStyle}
      data-render-scale={renderScale}
      role="img"
      aria-label={`${headline} ${text(page.body)} — ${text(page.footer)}. ${text(page.kicker)}`}
    >
      <div
        {...surfaceProps}
        className="mockup-surface mockup-print-measure"
        data-mockup-measure
        style={{ width: page.plane[0], height: page.plane[1] }}
        aria-hidden="true"
      >
        <div className="mockup-print" ref={printRef} style={faceStyle(faces.body)}>{content}</div>
      </div>
      {tiles ? tiles.map((tile, index) => (
        <div
          key={index}
          className="mockup-warp-tile"
          style={{ width: tile.width, height: tile.height, transform: tile.transform }}
          aria-hidden="true"
        >
          <div
            {...surfaceProps}
            className="mockup-surface mockup-rendered-surface"
            style={{ ...dimensions, transform: `translate(${-tile.x}px, ${-tile.y}px)` }}
          >
            <div className="mockup-print" style={faceStyle(faces.body)}>{content}</div>
          </div>
        </div>
      )) : (
        <div
          {...surfaceProps}
          className="mockup-surface mockup-rendered-surface"
          style={{ ...dimensions, transform: getMockupSurfaceTransform(page.surface, width, height) }}
          aria-hidden="true"
        >
          <div className="mockup-print" style={faceStyle(faces.body)}>{content}</div>
        </div>
      )}
    </div>
  );
}
