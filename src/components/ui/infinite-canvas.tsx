import { Minus, Plus, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

import { Button } from "@/components/ui/button";
import {
  getVisibleRepeats,
  type CanvasRepeat,
  type InfiniteCanvasItem,
} from "@/lib/repeating-canvas";

import "./infinite-canvas.css";

export type { InfiniteCanvasItem } from "@/lib/repeating-canvas";

type InfiniteCanvasProps<T extends InfiniteCanvasItem> = {
  items: readonly T[];
  renderItem: (item: T) => ReactNode;
  label: string;
  worldWidth: number;
  worldHeight: number;
};

const interactiveElements = ["a", "button", "input", "textarea", "select"];
const baseScale = 0.5;
const minimumScale = 0.2;

type Camera = { positionX: number; positionY: number; scale: number };

export function InfiniteCanvas<T extends InfiniteCanvasItem>({
  items,
  renderItem,
  label,
  worldWidth,
  worldHeight,
}: InfiniteCanvasProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const cameraRef = useRef<Camera>({
    positionX: 0,
    positionY: 0,
    scale: baseScale,
  });
  const instructionsId = useId();
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState<CanvasRepeat<T>[]>([]);
  const [zoom, setZoom] = useState(baseScale * 100);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  const updateVisible = useCallback(
    (camera: Camera) => {
      cameraRef.current = camera;
      const viewport = rootRef.current;
      if (!viewport) return;
      const next = getVisibleRepeats(
        items,
        {
          ...camera,
          width: viewport.clientWidth,
          height: viewport.clientHeight,
        },
        worldWidth,
        worldHeight,
      );
      // Cards keep their DOM and fitted lettering until they cross the buffer edge.
      setVisible((previous) =>
        previous.length === next.length &&
        previous.every(
          (entry, index) =>
            entry.key === next[index].key && entry.item === next[index].item,
        )
          ? previous
          : next,
      );
      setZoom(Math.round(camera.scale * 100));
    },
    [items, worldWidth, worldHeight],
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => updateVisible(cameraRef.current));
    observer.observe(root);
    updateVisible(cameraRef.current);
    return () => observer.disconnect();
  }, [updateVisible]);

  const animationTime = reducedMotion ? 0 : 180;
  const resetView = (controls: ReactZoomPanPinchRef, duration: number) => {
    const firstItem = items[0];
    if (!firstItem) return;
    const camera = {
      positionX: 16 - firstItem.x * baseScale,
      positionY: 24 - firstItem.y * baseScale,
      scale: baseScale,
    };
    void controls.setTransform(
      camera.positionX,
      camera.positionY,
      camera.scale,
      duration,
    );
    if (!duration) updateVisible(camera);
  };
  const reset = () => {
    if (transformRef.current) resetView(transformRef.current, animationTime);
  };

  const cards = useMemo(
    () =>
      visible.map(({ key, item, x, y, column, row }) => (
        <div
          key={key}
          className="infinite-canvas-item"
          data-canvas-item={item.id}
          data-repeat-column={column}
          data-repeat-row={row}
          style={{ left: x, top: y, width: item.width, minHeight: item.height }}
        >
          {renderItem(item)}
        </div>
      )),
    [visible, renderItem],
  );

  return (
    <div className="infinite-canvas" ref={rootRef}>
      <p id={instructionsId} className="sr-only">
        The mockups repeat in every direction. Drag to explore. Pinch, or hold
        Control or Command while scrolling, to zoom. With the canvas focused,
        use arrow keys to pan, plus and minus to zoom, Home or zero to reset,
        and Escape to leave. Scrolling without a modifier scrolls the page.
      </p>
      <TransformWrapper
        ref={transformRef}
        initialScale={baseScale}
        minScale={minimumScale}
        maxScale={2.5}
        limitToBounds={false}
        disablePadding
        smooth={!reducedMotion}
        wheel={{
          activationKeys: (keys) =>
            keys.includes("Control") || keys.includes("Meta"),
          excluded: interactiveElements,
        }}
        trackPadPanning={{ disabled: true }}
        panning={{
          velocityDisabled: reducedMotion,
          excluded: interactiveElements,
        }}
        pinch={{ allowPanning: true, excluded: interactiveElements }}
        doubleClick={{ disabled: true }}
        keyboard={{
          disabled: false,
          panStep: 120,
          zoomStep: 0.15,
          animationTime: reducedMotion ? 0 : 100,
          excluded: interactiveElements,
        }}
        zoomAnimation={{ disabled: reducedMotion, animationTime }}
        velocityAnimation={{
          disabled: reducedMotion,
          animationTime: 220,
          maxAnimationTime: 400,
          maxStrengthMouse: 16,
          maxStrengthTouch: 22,
        }}
        autoAlignment={{ disabled: true }}
        onInit={(controls) => resetView(controls, 0)}
        onTransform={(_controls, camera) => updateVisible(camera)}
      >
        <TransformComponent
          wrapperClass="infinite-canvas-viewport"
          contentClass="infinite-canvas-world"
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ width: worldWidth, height: worldHeight }}
          contentProps={{ "aria-hidden": true }}
          wrapperProps={{
            role: "region",
            "aria-label": label,
            "aria-describedby": instructionsId,
            tabIndex: 0,
            onDoubleClick: (event) => {
              const target = event.target as HTMLElement;
              if (target.closest("a,button,input,textarea,select")) return;
              const item = target.closest<HTMLElement>("[data-canvas-item]");
              if (item)
                void transformRef.current?.zoomToElement(item, {
                  maxScale: 1.25,
                  animationTime,
                });
            },
            onKeyDownCapture: (event) => {
              if (
                event.target !== event.currentTarget ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey
              )
                return;
              if (event.key === "Home" || event.key === "0") {
                event.preventDefault();
                event.stopPropagation();
                reset();
              } else if (event.key === "Escape") {
                event.currentTarget.blur();
              }
            },
          }}
        >
          {cards}
        </TransformComponent>
      </TransformWrapper>
      <div
        className="infinite-canvas-controls"
        role="group"
        aria-label="Canvas controls"
      >
        <Button
          size="icon-sm"
          aria-label="Zoom out"
          title="Zoom out (−)"
          onClick={() => {
            void transformRef.current?.zoomOut(0.15, animationTime);
          }}
        >
          <Minus aria-hidden="true" />
        </Button>
        <span className="infinite-canvas-zoom" aria-hidden="true">
          {zoom}%
        </span>
        <Button
          size="icon-sm"
          aria-label="Zoom in"
          title="Zoom in (+)"
          onClick={() => {
            void transformRef.current?.zoomIn(0.15, animationTime);
          }}
        >
          <Plus aria-hidden="true" />
        </Button>
        <Button
          size="icon-sm"
          aria-label="Reset canvas view"
          title="Reset view (Home)"
          onClick={reset}
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
