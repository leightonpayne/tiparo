import assert from "node:assert/strict";
import test from "node:test";

import assets from "../src/data/generated-mockup-assets.json" with { type: "json" };
import { createMockupWarpSampler, getMockupWarpTiles } from "../src/lib/mockup-warp.ts";
import { createMockupSurfaceProjector } from "../src/lib/mockup-projection.ts";

const flat = {
  u: [0, 1], v: [0, 1],
  points: Array.from({ length: 16 }, (_, i) => [(i % 4) / 3, Math.floor(i / 4) / 3]),
};
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const close = (a, b) => assert.ok(distance(a, b) < 1e-9, `${a} differs from ${b}`);

test("a flat bicubic envelope preserves the full perspective projection", () => {
  const warp = createMockupWarpSampler(flat);
  for (const [u, v] of [[0, 0], [1, 1], [0.25, 0.7], [0.83, 0.12]]) close(warp(u, v), [u, v]);
  const surface = [[120, 10], [700, 90], [650, 900], [30, 720]];
  const tiles = getMockupWarpTiles(flat, surface, 600, 800);
  assert.equal(tiles.length, 1);
  tiles[0].surface.forEach((point, index) => close(point, surface[index]));
  assert.deepEqual([tiles[0].x, tiles[0].y, tiles[0].width, tiles[0].height], [0, 0, 600, 800]);
});

test("curved control handles move interior points instead of just clipping a flat rectangle", () => {
  const bowed = {
    ...flat,
    points: flat.points.map(([x, y], i) => [x, y - (i === 1 || i === 2 ? 0.2 : 0)]),
  };
  const sample = createMockupWarpSampler(bowed);
  close(sample(0.5, 0), [0.5, -0.15]);
  close(sample(0.5, 0.5), [0.5, 0.48125]);
  close(sample(0.5, 1), [0.5, 1]);
});

test("piecewise envelopes keep their shared seam and hidden source margins", () => {
  const warp = {
    u: [0.1, 0.5, 0.9], v: [0, 1],
    points: Array.from({ length: 28 }, (_, i) => [(i % 7) / 6, Math.floor(i / 7) / 3]),
  };
  const sample = createMockupWarpSampler(warp);
  close(sample(0.3, 0.25), [0.25, 0.25]);
  close(sample(0.5, 0.4), [0.5, 0.4]);
  close(sample(0.7, 0.75), [0.75, 0.75]);
  assert.throws(() => sample(0, 0.5), /outside/);
  assert.throws(() => sample(1, 0.5), /outside/);
  const tiles = getMockupWarpTiles(warp, [[0, 0], [600, 0], [600, 800], [0, 800]], 600, 800);
  assert.equal(tiles.length, 2);
  close([tiles[0].x, tiles[0].width], [60, 240]);
  close([tiles[1].x, tiles[1].width], [300, 240]);
});

test("all source meshes stay within half a photo pixel at dense independent sample positions", () => {
  let surfaces = 0;
  for (const asset of assets) for (const page of asset.pages) {
    if (!page.warp) continue;
    surfaces++;
    const [width, height] = page.plane;
    const sample = createMockupWarpSampler(page.warp);
    const project = createMockupSurfaceProjector(page.surface, 1, 1);
    const tiles = getMockupWarpTiles(page.warp, page.surface, width, height);
    // The open book bends sharply near its spine and needs a denser grid.
    const patchBudget = asset.id === "md1263-4" ? 256 : 128;
    assert.ok(tiles.length <= patchBudget, `${asset.id}: excessive patch count`);
    let area = 0;
    for (const tile of tiles) {
      area += tile.width * tile.height;
      const approximate = createMockupSurfaceProjector(tile.surface, tile.width, tile.height);
      // These 1/7 intervals are different from the tessellator's 1/4 probes.
      for (let row = 0; row <= 7; row++) for (let col = 0; col <= 7; col++) {
        const x = tile.width * col / 7;
        const y = tile.height * row / 7;
        const expected = project(sample((tile.x + x) / width, (tile.y + y) / height));
        assert.ok(distance(approximate([x, y]), expected) < 0.5, `${asset.id}: inaccurate interior projection`);
      }
    }
    const expectedArea = width * height * (page.warp.u.at(-1) - page.warp.u[0]) * (page.warp.v.at(-1) - page.warp.v[0]);
    assert.ok(Math.abs(area - expectedArea) < 1e-7, `${asset.id}: incomplete source coverage`);
  }
  assert.equal(surfaces, 4);
});

test("malformed grids and invalid dimensions cannot produce CSS transforms", () => {
  for (const warp of [
    { ...flat, u: [0, 0, 1] },
    { ...flat, v: [0, Infinity] },
    { ...flat, points: flat.points.slice(1) },
    { ...flat, points: flat.points.map((p, i) => i ? p : [NaN, 0]) },
  ]) assert.throws(() => createMockupWarpSampler(warp), /Mockup warp/);
  for (const width of [0, -1, NaN, Infinity]) {
    assert.throws(() => getMockupWarpTiles(flat, [[0, 0], [100, 0], [100, 100], [0, 100]], width, 100), /positive/);
  }
});
