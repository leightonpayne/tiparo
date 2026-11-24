import {
  memo,
  useCallback,
  useMemo,
} from "react";

import { InfiniteCanvas, type CanvasRenderView, type InfiniteCanvasItem } from "@/components/ui/infinite-canvas";
import { MockupPrint } from "@/components/mockup-print";
import type { FontEntry } from "@/data/fonts";
import {
  mockupScenes,
  type MockupScene,
} from "@/data/mockup-scenes";
import { resolveMockupFaces } from "@/lib/mockup";
import { layoutMockups } from "@/lib/mockup-layout";
import "./font-mockup.css";

const MockupCard = memo(function MockupCard({
  font,
  scene,
  view,
}: {
  font: FontEntry;
  scene: MockupScene & InfiniteCanvasItem;
  view: CanvasRenderView;
}) {
  const faces = resolveMockupFaces(font, scene.design);
  const photoScale = scene.width / scene.crop.width;

  return (
    <figure
      className="mockup-card"
      data-scene={scene.id}
      data-design={scene.design}
    >
      <div
        className="mockup-frame"
        style={{ aspectRatio: `${scene.crop.width} / ${scene.crop.height}` }}
      >
        <div
          className="mockup-photo-plane"
          style={{
            width: scene.photo.width,
            height: scene.photo.height,
            transform: `scale(${photoScale}) translate(${-scene.crop.x}px, ${-scene.crop.y}px)`,
          }}
        >
          <img
            className="mockup-photo"
            src={`${import.meta.env.BASE_URL}mockups/${scene.image}`}
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
            {scene.pages.map((page) => (
              <div
                key={page.mask}
                className="mockup-page-mask"
                style={{
                  maskImage: `url("${import.meta.env.BASE_URL}mockups/${page.mask}")`,
                  // One continuous sheet beneath the text patches prevents
                  // antialiasing gaps from revealing the unprinted photograph.
                  backgroundColor: page.palette.paper,
                }}
              >
                <MockupPrint
                  font={font}
                  page={page}
                  faces={faces}
                  displayScale={photoScale * view.scale}
                  pixelRatio={view.pixelRatio}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
});

export function FontMockupGallery({ font }: { font: FontEntry }) {
  const mockupLayout = useMemo(() => {
    const shuffled = [...mockupScenes];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[index],
      ];
    }
    return layoutMockups(shuffled);
  }, [mockupScenes]);
  const renderCanvasItem = useCallback(
    (scene: MockupScene & InfiniteCanvasItem, view: CanvasRenderView) =>
      <MockupCard font={font} scene={scene} view={view} />,
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
