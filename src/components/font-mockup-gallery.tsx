import {
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { BookOpenIcon, SearchIcon } from "lucide-react";

import { InfiniteCanvas } from "@/components/ui/infinite-canvas";
import { MockupIcon } from "@/components/mockup-icon";
import type { FontEntry } from "@/data/fonts";
import {
  mockupScenes,
  type MockupScene,
  type MockupPage,
} from "@/data/mockup-scenes";
import { getMockupText, resolveMockupFaces } from "@/lib/mockup";
import { layoutMockups } from "@/lib/mockup-layout";
import { getMockupSurfaceTransform } from "@/lib/mockup-projection";
import "./font-mockup.css";

function MockupPrint({
  font,
  page,
  faces,
}: {
  font: FontEntry;
  page: MockupPage;
  faces: ReturnType<typeof resolveMockupFaces>;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const isScreen = page.composition === "screen";
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
      let factor = 1;
      print.style.setProperty("--mockup-fit", "1");
      for (let attempt = 0; attempt < 12; attempt++) {
        if (
          print.scrollHeight <= print.clientHeight + 1 &&
          print.scrollWidth <= print.clientWidth + 1
        )
          break;
        const ratio = Math.min(
          print.clientHeight / print.scrollHeight,
          print.clientWidth / print.scrollWidth,
        );
        factor *= Math.min(0.9, ratio);
        print.style.setProperty("--mockup-fit", String(factor));
      }
    };
    fit();
    document.fonts.ready.then(fit);
    document.fonts.addEventListener("loadingdone", fit);
    return () => {
      disposed = true;
      document.fonts.removeEventListener("loadingdone", fit);
    };
  }, [font, page]);

  return (
    <div
      className="mockup-surface"
      data-composition={page.composition}
      data-screen-format={
        isScreen ? (page.plane[0] > page.plane[1] ? "wide" : "tall") : undefined
      }
      style={{
        width: page.plane[0],
        height: page.plane[1],
        transform: getMockupSurfaceTransform(page.surface, ...page.plane),
      }}
    >
      <div
        className="mockup-print"
        ref={printRef}
        style={{ ...faceStyle(faces.body), color: page.ink }}
      >
        {isScreen && (
          <div className="mockup-screen-nav" aria-hidden="true">
            <BookOpenIcon />
            <span>{text("Readings")}</span>
            <SearchIcon />
          </div>
        )}
        <p className="mockup-print-kicker">{text(page.kicker)}</p>
        <div
          className="mockup-print-main"
          data-icon-layout={
            page.icon ? (page.iconLayout ?? "above") : undefined
          }
        >
          {page.icon && <MockupIcon name={page.icon} />}
          <div className="mockup-print-copy">
            {page.headline && (
              <h4
                style={{
                  ...faceStyle(faces.headline),
                  ...(page.headlineSize
                    ? {
                        fontSize: `calc(${page.headlineSize}cqw * var(--mockup-fit, 1))`,
                      }
                    : {}),
                }}
              >
                {text(page.headline)}
              </h4>
            )}
            {page.body && (
              <p className="mockup-print-body">{text(page.body)}</p>
            )}
          </div>
        </div>
        <p className="mockup-print-footer">{text(page.footer)}</p>
      </div>
    </div>
  );
}

const MockupCard = memo(function MockupCard({
  font,
  scene,
}: {
  font: FontEntry;
  scene: MockupScene;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const faces = resolveMockupFaces(font, scene.design);
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const resize = () =>
      frame.style.setProperty(
        "--photo-scale",
        String(frame.clientWidth / scene.crop.width),
      );
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [scene]);

  return (
    <figure
      className="mockup-card"
      data-scene={scene.id}
      data-design={scene.design}
      data-tone={
        scene.tone ?? (scene.design === "broadside" ? "light" : "dark")
      }
    >
      <div
        className="mockup-frame"
        ref={frameRef}
        style={{ aspectRatio: `${scene.crop.width} / ${scene.crop.height}` }}
      >
        <div
          className="mockup-photo-plane"
          style={{
            width: scene.photo.width,
            height: scene.photo.height,
            transform: `scale(var(--photo-scale, 0)) translate(${-scene.crop.x}px, ${-scene.crop.y}px)`,
          }}
        >
          <img
            className="mockup-photo"
            src={`${import.meta.env.BASE_URL}mockups/${scene.id}.webp`}
            width={scene.photo.width}
            height={scene.photo.height}
            loading="eager"
            decoding="async"
            draggable={false}
            alt={scene.alt}
          />
          <div
            className="mockup-projection"
            style={{ width: scene.photo.width, height: scene.photo.height }}
          >
            <MockupPrint font={font} page={scene} faces={faces} />
            {scene.verso && (
              <MockupPrint font={font} page={scene.verso} faces={faces} />
            )}
          </div>
        </div>
      </div>
    </figure>
  );
});

export function FontMockupGallery({ font }: { font: FontEntry }) {
  const [mockupLayout] = useState(() => {
    const shuffled = [...mockupScenes];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[index],
      ];
    }
    // Lead with street and studio scenes; keep both groups fresh on each visit.
    return layoutMockups([
      ...shuffled.filter((scene) => scene.setting !== undefined),
      ...shuffled.filter((scene) => scene.setting === undefined),
    ]);
  });
  const renderCanvasItem = useCallback(
    (scene: MockupScene) => <MockupCard font={font} scene={scene} />,
    [font],
  );
  return (
    <section
      className="ui-section font-mockup-gallery"
      aria-label="Mockups"
      data-reveal="fade"
    >
      <InfiniteCanvas
        label={`${font.family} repeating mockup canvas`}
        {...mockupLayout}
        renderItem={renderCanvasItem}
      />
    </section>
  );
}
