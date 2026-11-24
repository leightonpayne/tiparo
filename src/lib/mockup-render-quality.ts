import { createMockupSurfaceProjector, type MockupPoint, type MockupSurface } from "./mockup-projection.ts";
import { createMockupWarpSampler, type MockupWarp } from "./mockup-warp.ts";

const canvasScales = [0.25, 0.5, 1, 2, 4] as const;

/** Upper zoom bands keep camera motion from rebuilding prints on every frame. */
export function quantizeCanvasScale(scale: number, previous?: number): number {
  if (!Number.isFinite(scale) || scale <= 0 ||
      (previous !== undefined && !canvasScales.some(value => value === previous))) {
    throw new Error("Canvas quality needs a finite positive zoom and a valid previous band.");
  }
  const next = canvasScales.find(value => value >= scale) ?? canvasScales.at(-1)!;
  // Upgrade immediately, but leave a small dead band when zooming back out.
  if (previous !== undefined && next < previous && scale > previous * 0.5 * 0.9) return previous;
  return next;
}

type PrintGeometry = {
  surface: MockupSurface;
  plane: readonly [number, number];
  warp?: MockupWarp;
};

function projectedSourceScale({ surface, plane: [width, height], warp }: PrintGeometry): number {
  if (![width, height].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error("Mockup quality needs finite positive print dimensions.");
  }
  const project = createMockupSurfaceProjector(surface, 1, 1);
  const sample = warp ? createMockupWarpSampler(warp) : (u: number, v: number): MockupPoint => [u, v];
  const at = (u: number, v: number) => project(sample(u, v));
  const u = warp?.u ?? [0, 1];
  const v = warp?.v ?? [0, 1];
  let maximum = 0;

  // Probe each patch, including the curved edges and perspective-expanded corners.
  // The Jacobian's largest singular value includes diagonal stretching and shear.
  for (let row = 0; row < v.length - 1; row++) {
    for (let column = 0; column < u.length - 1; column++) {
      const u0 = u[column], u1 = u[column + 1];
      const v0 = v[row], v1 = v[row + 1];
      const du = (u1 - u0) * 1e-4;
      const dv = (v1 - v0) * 1e-4;
      for (const x of [0, 0.25, 0.5, 0.75, 1]) {
        for (const y of [0, 0.25, 0.5, 0.75, 1]) {
          const a = u0 + (u1 - u0) * x;
          const b = v0 + (v1 - v0) * y;
          const left = Math.max(u0, a - du), right = Math.min(u1, a + du);
          const top = Math.max(v0, b - dv), bottom = Math.min(v1, b + dv);
          const p0 = at(left, b), p1 = at(right, b);
          const q0 = at(a, top), q1 = at(a, bottom);
          const dx = [(p1[0] - p0[0]) / ((right - left) * width), (p1[1] - p0[1]) / ((right - left) * width)];
          const dy = [(q1[0] - q0[0]) / ((bottom - top) * height), (q1[1] - q0[1]) / ((bottom - top) * height)];
          const xx = dx[0] ** 2 + dx[1] ** 2;
          const xy = dx[0] * dy[0] + dx[1] * dy[1];
          const yy = dy[0] ** 2 + dy[1] ** 2;
          maximum = Math.max(maximum, Math.sqrt((xx + yy + Math.hypot(xx - yy, 2 * xy)) / 2));
        }
      }
    }
  }
  if (!Number.isFinite(maximum) || maximum <= 0) {
    throw new Error("Mockup quality needs a finite, non-degenerate projected print.");
  }
  return maximum;
}

/** Screen/device-pixel detail, independent of camera position and print layout. */
export function getMockupRenderQuality(
  page: PrintGeometry,
  displayScale: number,
  pixelRatio = 1,
): { renderScale: 1 | 2 | 4; warpTolerance: number } {
  const photoPixels = displayScale * pixelRatio;
  if (![displayScale, pixelRatio, photoPixels].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error("Mockup quality needs finite positive display scale and pixel ratio.");
  }
  const demand = projectedSourceScale(page) * photoPixels;
  if (!Number.isFinite(demand)) throw new Error("Mockup quality exceeds finite rendering dimensions.");
  return {
    // Tolerate floating-point noise at exact 1× and 2× projection boundaries.
    renderScale: demand <= 1 + 1e-8 ? 1 : demand <= 2 + 1e-8 ? 2 : 4,
    // Aim for 0.35 device pixels; budget limits bound overview work and dense meshes.
    warpTolerance: Math.max(0.08, Math.min(2, 0.35 / photoPixels)),
  };
}
