export type InfiniteCanvasItem = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasViewport = {
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  scale: number;
};

export type CanvasRepeat<T extends InfiniteCanvasItem> = {
  key: string;
  item: T;
  x: number;
  y: number;
  column: number;
  row: number;
};

/** Enumerate only the periodic copies intersecting the viewport and its pixel buffer. */
export function getVisibleRepeats<T extends InfiniteCanvasItem>(
  items: readonly T[],
  viewport: CanvasViewport,
  worldWidth: number,
  worldHeight: number,
  overscan = 240,
): CanvasRepeat<T>[] {
  if (
    ![worldWidth, worldHeight, viewport.scale].every(
      (value) => Number.isFinite(value) && value > 0,
    ) ||
    ![viewport.width, viewport.height, overscan].every(
      (value) => Number.isFinite(value) && value >= 0,
    ) ||
    ![viewport.positionX, viewport.positionY].every(Number.isFinite)
  ) {
    throw new Error(
      "Repeating canvas needs finite coordinates, positive periods and scale, and nonnegative viewport dimensions.",
    );
  }
  if (!viewport.width || !viewport.height) return [];

  const left = (-viewport.positionX - overscan) / viewport.scale;
  const top = (-viewport.positionY - overscan) / viewport.scale;
  const right =
    (viewport.width - viewport.positionX + overscan) / viewport.scale;
  const bottom =
    (viewport.height - viewport.positionY + overscan) / viewport.scale;
  const visible: CanvasRepeat<T>[] = [];

  for (const item of items) {
    if (
      ![item.x, item.y].every(Number.isFinite) ||
      ![item.width, item.height].every(
        (value) => Number.isFinite(value) && value > 0,
      )
    ) {
      throw new Error(
        `Canvas item ${item.id} needs finite coordinates and positive dimensions.`,
      );
    }
    // Floor/ceil are deliberate: truncation breaks copies left of and above the origin.
    const firstColumn =
      Math.floor((left - item.x - item.width) / worldWidth) + 1;
    const lastColumn = Math.ceil((right - item.x) / worldWidth) - 1;
    const firstRow = Math.floor((top - item.y - item.height) / worldHeight) + 1;
    const lastRow = Math.ceil((bottom - item.y) / worldHeight) - 1;
    for (let row = firstRow; row <= lastRow; row++) {
      for (let column = firstColumn; column <= lastColumn; column++) {
        visible.push({
          key: `${item.id}@${column},${row}`,
          item,
          x: item.x + column * worldWidth,
          y: item.y + row * worldHeight,
          column,
          row,
        });
      }
    }
  }
  return visible;
}
