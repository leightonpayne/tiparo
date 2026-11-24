import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import assets from "../src/data/generated-mockup-assets.json" with { type: "json" };
import { mockupScenes } from "../src/data/mockup-scenes.ts";
import { getMockupSurfaceTransform } from "../src/lib/mockup-projection.ts";

const suppliedMockups = [
  "md1034-1", "md1034-2", "md1034-3",
  "md1145-1", "md1145-2", "md1145-3", "md1145-4",
  "md1263-1", "md1263-2", "md1263-3", "md1263-4",
  "mdp063", "mds339", "mdu025", "mdu033", "mdu044", "mdu047", "mdu049",
  "mdu055", "mdu056", "mdu059", "mdu062", "mdu064", "mdu067", "mdu068",
  "mdu069", "mdu070", "mdu071", "mdu075", "mdu076", "mdu077", "mdu078",
  "mdu079", "mdu081", "mdu084", "mdu085", "mdu086", "mdu088", "mdu089",
  "mdu090",
];

// Read the dimensions from the encoded assets, independently of their manifest.
// This supports extended, lossy and lossless WebP without an image dependency.
function webpInfo(path) {
  assert.match(path, /^local\/[a-z0-9-]+\.webp$/);
  const bytes = readFileSync(new URL(`../public/mockups/${path}`, import.meta.url));
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF", path);
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP", path);
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, `${path}: truncated WebP`);
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const kind = bytes.toString("ascii", offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    assert.ok(start + length <= bytes.length, `${path}: invalid chunk`);
    if (kind === "VP8X") {
      return {
        width: bytes.readUIntLE(start + 4, 3) + 1,
        height: bytes.readUIntLE(start + 7, 3) + 1,
        alpha: Boolean(bytes[start] & 0x10),
      };
    }
    if (kind === "VP8L") {
      assert.equal(bytes[start], 0x2f, path);
      const bits = bytes.readUInt32LE(start + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
        alpha: Boolean((bits >>> 28) & 1),
      };
    }
    if (kind === "VP8 ") {
      return {
        width: bytes.readUInt16LE(start + 6) & 0x3fff,
        height: bytes.readUInt16LE(start + 8) & 0x3fff,
        alpha: false,
      };
    }
    offset = start + length + (length % 2);
  }
  assert.fail(`${path}: missing WebP image chunk`);
}

test("all supplied mockups replace the previous image collection with traceable local exports", () => {
  assert.deepEqual(mockupScenes.map(({ id }) => id).sort(), suppliedMockups);
  assert.deepEqual(assets.map(({ id }) => id).sort(), suppliedMockups);
  assert.equal(new Set(mockupScenes.map(({ sourceArchive }) => sourceArchive)).size, 32);
  const expectedFiles = [];

  for (const scene of mockupScenes) {
    const asset = assets.find(({ id }) => id === scene.id);
    assert.equal(scene.sourceArchive, asset.archive);
    const archiveId = scene.id.split("-")[0].toUpperCase();
    assert.match(scene.sourceArchive, new RegExp(`^${archiveId}_[A-Za-z0-9_,]+\\.zip$`));
    if (scene.id.includes("-")) {
      assert.equal(scene.sourceDocument, asset.document, scene.id);
      assert.match(scene.sourceDocument, new RegExp(`_${scene.id.split("-")[1]}\\.psd$`));
    }
    assert.equal(new URL(scene.photo.url).protocol, "https:");
    assert.equal(new URL(scene.sourceUrl).protocol, "https:");
    assert.ok(scene.photo.author && scene.alt && scene.label, scene.id);
    assert.equal(scene.pages.length, asset.pages.length, scene.id);
    assert.ok(scene.pages.length > 0, scene.id);
    expectedFiles.push(scene.image, ...scene.pages.map(({ mask }) => mask));
  }

  assert.equal(new Set(expectedFiles).size, expectedFiles.length);
  const exportedFiles = readdirSync(new URL("../public/mockups/local/", import.meta.url));
  assert.deepEqual(exportedFiles.map((file) => `local/${file}`).sort(), expectedFiles.sort());
  assert.deepEqual(readdirSync(new URL("../public/mockups/", import.meta.url)), ["local"]);
  assert.equal(mockupScenes.find(({ id }) => id === "mdu090").pages.length, 3);
});

test("photographs and alpha masks use the same image coordinate space", () => {
  for (const scene of mockupScenes) {
    const { width, height } = webpInfo(scene.image);
    assert.deepEqual([width, height], [scene.photo.width, scene.photo.height], scene.id);
    assert.ok(Math.max(width, height) <= 1800, scene.id);
    for (const page of scene.pages) {
      const mask = webpInfo(page.mask);
      assert.deepEqual([mask.width, mask.height], [width, height], page.mask);
      assert.equal(mask.alpha, true, `${page.mask}: CSS requires alpha, not a grayscale image`);
    }
  }
});

test("multi-scene packs include every photograph and its printed surfaces", () => {
  for (const [pack, pageCounts] of [
    ["md1034", [1, 1, 2]],
    ["md1145", [1, 1, 1, 2]],
    ["md1263", [1, 2, 1, 2]],
  ]) {
    const scenes = mockupScenes.filter(({ id }) => id.startsWith(`${pack}-`));
    assert.deepEqual(scenes.map(({ pages }) => pages.length), pageCounts, pack);
    assert.equal(new Set(scenes.map(({ sourceDocument }) => sourceDocument)).size, pageCounts.length, pack);
  }
});

test("every live print surface has a valid projection and intersects its photograph", () => {
  for (const scene of mockupScenes) {
    const { crop, photo } = scene;
    assert.ok(crop.x >= 0 && crop.y >= 0, scene.id);
    assert.ok(crop.width > 0 && crop.height > 0, scene.id);
    assert.ok(crop.x + crop.width <= photo.width, scene.id);
    assert.ok(crop.y + crop.height <= photo.height, scene.id);

    for (const page of scene.pages) {
      assert.ok(page.headline.trim(), `${scene.id}: missing live text`);
      assert.doesNotThrow(
        () => getMockupSurfaceTransform(page.surface, ...page.plane),
        scene.id,
      );
      // Adjacent posters and banners may extend outside the original photograph.
      // Their alpha masks clip them; the visible portion must intersect the crop.
      const xs = page.surface.map(([x]) => x);
      const ys = page.surface.map(([, y]) => y);
      assert.ok(Math.max(...xs) > crop.x && Math.min(...xs) < crop.x + crop.width, scene.id);
      assert.ok(Math.max(...ys) > crop.y && Math.min(...ys) < crop.y + crop.height, scene.id);
    }
  }
});
