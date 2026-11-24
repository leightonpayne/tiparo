import assert from "node:assert/strict";
import test from "node:test";

import { mockupScenes } from "../src/data/mockup-scenes.ts";
import { layoutMockups } from "../src/lib/mockup-layout.ts";
import { createMockupSurfaceProjector } from "../src/lib/mockup-projection.ts";
import { getMockupRenderQuality, quantizeCanvasScale } from "../src/lib/mockup-render-quality.ts";
import { createMockupWarpSampler, getMockupWarpTiles } from "../src/lib/mockup-warp.ts";

const page = { surface: [[0, 0], [600, 0], [600, 800], [0, 800]], plane: [600, 800] };
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test("zoom bands upgrade immediately and resist small reversals at their boundaries", () => {
  assert.deepEqual([0.2, 0.25, 0.251, 0.5, 0.51, 1, 1.1, 2, 2.1, 4, 5].map(scale => quantizeCanvasScale(scale)),
    [0.25, 0.25, 0.5, 0.5, 1, 1, 2, 2, 4, 4, 4]);
  let previous = 0.5;
  const bands = [0.51, 0.49, 0.51, 0.46, 0.44].map(scale => previous = quantizeCanvasScale(scale, previous));
  assert.deepEqual(bands, [1, 1, 1, 1, 0.5]);
  assert.equal(quantizeCanvasScale(0.2, 4), 0.25);
});

test("render density follows zoom and device pixels without exceeding the source budget", () => {
  const qualities = [0.2, 0.5, 1, 2, 4].map(scale => getMockupRenderQuality(page, scale));
  assert.deepEqual(qualities.map(q => q.renderScale), [1, 1, 1, 2, 4]);
  qualities.slice(1).forEach((quality, i) => assert.ok(quality.warpTolerance <= qualities[i].warpTolerance));
  assert.deepEqual(getMockupRenderQuality(page, 1, 2), getMockupRenderQuality(page, 2, 1));
  assert.equal(getMockupRenderQuality(page, 100, 3).renderScale, 4);
  assert.equal(getMockupRenderQuality(page, 100, 3).warpTolerance, 0.08);
  assert.equal(getMockupRenderQuality(page, 0.01).warpTolerance, 2);
});

test("density accounts for placement expansion and shear, independent of translation", () => {
  const expanded = { ...page, surface: page.surface.map(([x, y]) => [x * 2, y * 2]) };
  assert.equal(getMockupRenderQuality(expanded, 1).renderScale, 2);
  const sheared = { ...page, surface: [[0, 0], [600, 0], [1200, 800], [600, 800]] };
  assert.equal(getMockupRenderQuality(sheared, 1).renderScale, 2);
  const shifted = { ...sheared, surface: sheared.surface.map(([x, y]) => [x + 732, y - 98]) };
  assert.deepEqual(getMockupRenderQuality(sheared, 1), getMockupRenderQuality(shifted, 1));
});

test("higher source resolution maps to the same physical print corners and interior", () => {
  const surface = [[123, 47], [690, 113], [712, 934], [35, 701]];
  const original = createMockupSurfaceProjector(surface, ...page.plane);
  for (const scale of [1, 2, 4]) {
    const enlarged = createMockupSurfaceProjector(surface, page.plane[0] * scale, page.plane[1] * scale);
    for (const p of [[0, 0], [600, 800], [143, 591], [300, 400]]) {
      assert.ok(distance(original(p), enlarged(p.map(value => value * scale))) < 1e-9);
    }
  }
});

test("all curved assets retain screen-space accuracy and bounded detail across zoom and DPR", () => {
  const scenes = layoutMockups(mockupScenes).items;
  let surfaces = 0;
  for (const scene of scenes) for (const page of scene.pages) {
    if (!page.warp) continue;
    surfaces++;
    const sample = createMockupWarpSampler(page.warp);
    const project = createMockupSurfaceProjector(page.surface, 1, 1);
    for (const zoom of [0.2, 0.5, 1, 2, 4]) for (const dpr of [1, 2, 3]) {
      const displayScale = scene.width / scene.crop.width * quantizeCanvasScale(zoom);
      const quality = getMockupRenderQuality(page, displayScale, dpr);
      const [width, height] = page.plane.map(value => value * quality.renderScale);
      const tiles = getMockupWarpTiles(page.warp, page.surface, width, height, quality.warpTolerance);
      assert.ok(tiles.length <= 1024, `${scene.id}, zoom ${zoom}, DPR ${dpr}: excessive patch count ${tiles.length}`);
      for (const tile of tiles) {
        const approximate = createMockupSurfaceProjector(tile.surface, tile.width, tile.height);
        // Independent sample positions differ from the tessellator's quarter probes.
        for (const x of [1 / 7, 3 / 7, 5 / 7, 1]) for (const y of [1 / 7, 3 / 7, 5 / 7, 1]) {
          const px = tile.width * x, py = tile.height * y;
          const exact = project(sample((tile.x + px) / width, (tile.y + py) / height));
          const error = distance(approximate([px, py]), exact) * displayScale * dpr;
          assert.ok(error < 0.5, `${scene.id}, zoom ${zoom}, DPR ${dpr}: ${error} device-pixel error`);
        }
      }
    }
  }
  assert.equal(surfaces, 4);
});

test("invalid scales, densities and dimensions are rejected before rendering", () => {
  for (const invalid of [0, -1, NaN, Infinity]) {
    assert.throws(() => quantizeCanvasScale(invalid), /finite positive/);
    assert.throws(() => getMockupRenderQuality(page, invalid), /finite positive/);
    assert.throws(() => getMockupRenderQuality(page, 1, invalid), /finite positive/);
    assert.throws(() => getMockupRenderQuality({ ...page, plane: [invalid, 800] }, 1), /finite positive/);
  }
  assert.throws(() => quantizeCanvasScale(1, 3), /previous band/);
  assert.throws(() => getMockupRenderQuality(page, Number.MAX_VALUE, 2), /finite positive/);
});
