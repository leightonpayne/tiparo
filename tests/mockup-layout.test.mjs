import assert from "node:assert/strict";
import test from "node:test";

import { layoutMockups } from "../src/lib/mockup-layout.ts";

test("an incomplete final row does not create oversized cards", () => {
  const { items } = layoutMockups(
    Array.from({ length: 33 }, (_, index) => ({
      id: String(index),
      crop: { width: 800, height: 1000 },
    })),
  );
  const rows = Map.groupBy(items, (item) => item.y);
  assert.deepEqual(
    [...rows.values()].map((row) => row.length),
    [6, 6, 6, 5, 5, 5],
  );
  const heights = items.map((item) => item.height);
  assert.ok(Math.max(...heights) / Math.min(...heights) < 1.3);
});

test("chosen crop proportions fill rows without distortion, overlaps, or uneven repeat seams", () => {
  const scenes = Array.from({ length: 24 }, (_, i) => ({
    id: String(i),
    crop: {
      width: [1600, 1200, 1600][i % 3],
      height: [1200, 1800, 900][i % 3],
    },
  }));
  const { items, worldWidth, worldHeight } = layoutMockups(scenes);
  assert.equal(items.length, 24);
  assert.equal(new Set(items.map((item) => item.id)).size, 24);
  for (let row = 0; row < 4; row++) {
    const group = items.slice(row * 6, row * 6 + 6);
    assert.equal(group[0].x, 24);
    assert.ok(
      Math.abs(worldWidth - group.at(-1).x - group.at(-1).width - 24) < 1e-8,
    );
    for (let i = 0; i < group.length; i++) {
      const item = group[i];
      assert.equal(item.y, group[0].y);
      assert.ok(
        Math.abs(
          item.width / item.height - item.crop.width / item.crop.height,
        ) < 1e-8,
      );
      if (i)
        assert.ok(
          Math.abs(item.x - group[i - 1].x - group[i - 1].width - 48) < 1e-8,
        );
    }
    if (row)
      assert.ok(
        Math.abs(
          group[0].y -
            items[(row - 1) * 6].y -
            items[(row - 1) * 6].height -
            48,
        ) < 1e-8,
      );
  }
  const last = items.at(-1);
  assert.ok(Math.abs(worldHeight - last.y - last.height - 24) < 1e-8);
});
