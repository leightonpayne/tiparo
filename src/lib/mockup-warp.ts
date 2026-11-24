import {
  createMockupSurfaceProjector,
  getMockupSurfaceTransform,
  type MockupPoint,
  type MockupSurface,
} from "./mockup-projection.ts";

/** Piecewise bicubic Photoshop envelope, normalized to its placement rectangle. */
export type MockupWarp = {
  u: readonly number[];
  v: readonly number[];
  points: readonly MockupPoint[];
};

export type MockupWarpTile = {
  x: number;
  y: number;
  width: number;
  height: number;
  surface: MockupSurface;
  transform: string;
};

export function createMockupWarpSampler(warp: MockupWarp) {
  for (const axis of [warp.u, warp.v]) {
    if (axis.length < 2 || axis.some((value, index) =>
      !Number.isFinite(value) || value < 0 || value > 1 ||
      (index > 0 && value <= axis[index - 1]))) {
      throw new Error("Mockup warp breaks must increase within [0, 1].");
    }
  }
  const columns = (warp.u.length - 1) * 3 + 1;
  const rows = (warp.v.length - 1) * 3 + 1;
  if (warp.points.length !== columns * rows || warp.points.some(point =>
    point.length !== 2 || !point.every(Number.isFinite))) {
    throw new Error("Mockup warp requires a complete finite bicubic control grid.");
  }
  const patch = (axis: readonly number[], value: number) => {
    if (!Number.isFinite(value) || value < axis[0] - 1e-12 || value > axis.at(-1)! + 1e-12) {
      throw new Error("Mockup warp sample lies outside its visible domain.");
    }
    const index = Math.min(axis.length - 2, axis.findIndex(end => end > value) - 1);
    return index < 0 ? axis.length - 2 : index;
  };
  const basis = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return [(1 - t) ** 3, 3 * t * (1 - t) ** 2, 3 * t * t * (1 - t), t ** 3];
  };
  return (u: number, v: number): MockupPoint => {
    const column = patch(warp.u, u);
    const row = patch(warp.v, v);
    const bu = basis((u - warp.u[column]) / (warp.u[column + 1] - warp.u[column]));
    const bv = basis((v - warp.v[row]) / (warp.v[row + 1] - warp.v[row]));
    let x = 0;
    let y = 0;
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        const point = warp.points[(row * 3 + j) * columns + column * 3 + i];
        const weight = bu[i] * bv[j];
        x += point[0] * weight;
        y += point[1] * weight;
      }
    }
    return [x, y];
  };
}

/** Small live-HTML patches follow the source envelope to subpixel accuracy. */
export function getMockupWarpTiles(
  warp: MockupWarp,
  surface: MockupSurface,
  width: number,
  height: number,
  tolerance = 0.35,
): MockupWarpTile[] {
  if (![width, height, tolerance].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error("Mockup warp dimensions and tolerance must be finite and positive.");
  }
  const sample = createMockupWarpSampler(warp);
  const project = createMockupSurfaceProjector(surface, 1, 1);
  const at = (u: number, v: number) => project(sample(u, v));
  let columns = 1;
  let rows = 1;
  for (;;) {
    const tiles: MockupWarpTile[] = [];
    let horizontalError = 0;
    let verticalError = 0;
    let interiorError = 0;
    for (let pv = 0; pv < warp.v.length - 1; pv++) {
      for (let pu = 0; pu < warp.u.length - 1; pu++) {
        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < columns; column++) {
            const u0 = warp.u[pu] + (warp.u[pu + 1] - warp.u[pu]) * column / columns;
            const u1 = warp.u[pu] + (warp.u[pu + 1] - warp.u[pu]) * (column + 1) / columns;
            const v0 = warp.v[pv] + (warp.v[pv + 1] - warp.v[pv]) * row / rows;
            const v1 = warp.v[pv] + (warp.v[pv + 1] - warp.v[pv]) * (row + 1) / rows;
            const corners: MockupSurface = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
            const approximate = createMockupSurfaceProjector(corners, 1, 1);
            for (const x of [0, 0.25, 0.5, 0.75, 1]) {
              for (const y of [0, 0.25, 0.5, 0.75, 1]) {
                const exact = at(u0 + (u1 - u0) * x, v0 + (v1 - v0) * y);
                const actual = approximate([x, y]);
                const error = Math.hypot(exact[0] - actual[0], exact[1] - actual[1]);
                if (y === 0 || y === 1) horizontalError = Math.max(horizontalError, error);
                else if (x === 0 || x === 1) verticalError = Math.max(verticalError, error);
                else interiorError = Math.max(interiorError, error);
              }
            }
            tiles.push({
              x: u0 * width, y: v0 * height,
              width: (u1 - u0) * width, height: (v1 - v0) * height,
              surface: corners,
              transform: getMockupSurfaceTransform(corners, (u1 - u0) * width, (v1 - v0) * height),
            });
          }
        }
      }
    }
    if (Math.max(horizontalError, verticalError, interiorError) <= tolerance) return tiles;
    if (columns >= 64 && rows >= 32) throw new Error("Mockup warp cannot meet the projection tolerance.");
    if (columns < 64 && (horizontalError >= verticalError || rows >= 32)) columns *= 2;
    else rows *= 2;
  }
}
