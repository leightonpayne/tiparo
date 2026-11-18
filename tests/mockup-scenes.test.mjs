import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import test from "node:test";

import { mockupScenes } from "../src/data/mockup-scenes.ts";
import { getMockupSurfaceTransform } from "../src/lib/mockup-projection.ts";

test("each mockup has a unique local image and traceable image and text sources", () => {
  const images = readdirSync(new URL("../public/mockups/", import.meta.url));
  const expected = mockupScenes.map(({ id }) => `${id}.webp`);
  assert.equal(new Set(expected).size, expected.length);
  assert.deepEqual(images.sort(), expected.sort());
  for (const scene of mockupScenes) {
    assert.equal(new URL(scene.photo.url).protocol, "https:");
    assert.equal(new URL(scene.sourceUrl).protocol, "https:");
    assert.ok(scene.photo.author && scene.alt && scene.headline);
  }
});

test("framing keeps every printed page inside the image and makes print the dominant subject", () => {
  for (const scene of mockupScenes) {
    const { crop, photo } = scene;
    assert.ok(crop.x >= 0 && crop.y >= 0, scene.id);
    assert.ok(crop.width > 0 && crop.height > 0, scene.id);
    assert.ok(crop.x + crop.width <= photo.width, scene.id);
    assert.ok(crop.y + crop.height <= photo.height, scene.id);
    const pages = scene.verso ? [scene, scene.verso] : [scene];
    const points = pages.flatMap(({ surface }) => surface);
    for (const [x, y] of points) {
      assert.ok(x >= crop.x && x <= crop.x + crop.width, `${scene.id}: x=${x}`);
      assert.ok(
        y >= crop.y && y <= crop.y + crop.height,
        `${scene.id}: y=${y}`,
      );
    }
    const xs = points.map(([x]) => x);
    assert.ok(
      (Math.max(...xs) - Math.min(...xs)) / crop.width >= 0.55,
      `${scene.id}: print too distant`,
    );
    for (const page of pages) {
      assert.doesNotThrow(
        () => getMockupSurfaceTransform(page.surface, ...page.plane),
        scene.id,
      );
    }
  }
});
