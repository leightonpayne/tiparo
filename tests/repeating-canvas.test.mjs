import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleRepeats } from "../src/lib/repeating-canvas.ts";

const item = { id: "poster", x: 0, y: 0, width: 100, height: 100 };
const viewport = {
  width: 100,
  height: 100,
  positionX: 0,
  positionY: 0,
  scale: 1,
};

const positions = (copies) => copies.map(({ column, row }) => [column, row]);

test("repetition spans both sides of the origin without double-counting touching edges", () => {
  assert.deepEqual(
    positions(getVisibleRepeats([item], viewport, 100, 100, 0)),
    [[0, 0]],
  );
  assert.deepEqual(
    positions(
      getVisibleRepeats(
        [item],
        { ...viewport, positionX: 50, positionY: 50 },
        100,
        100,
        0,
      ),
    ),
    [
      [-1, -1],
      [0, -1],
      [-1, 0],
      [0, 0],
    ],
  );
  assert.deepEqual(
    positions(
      getVisibleRepeats(
        [item],
        { ...viewport, positionX: -100, positionY: -200 },
        100,
        100,
        0,
      ),
    ),
    [[1, 2]],
  );
});

test("zoom and pixel overscan select the correct world-space copies", () => {
  const copies = getVisibleRepeats(
    [item],
    { ...viewport, scale: 2 },
    100,
    100,
    50,
  );
  assert.deepEqual(positions(copies), [
    [-1, -1],
    [0, -1],
    [-1, 0],
    [0, 0],
  ]);
  assert.equal(copies[0].x, -100);
  assert.equal(copies[0].y, -100);
  assert.equal(copies[0].item, item);
});

test("culling excludes distant items and accounts for item offsets and dimensions", () => {
  const items = [
    { ...item, id: "small", x: 80, y: 40, width: 20, height: 30 },
    { ...item, id: "wide", x: 110, y: 0, width: 200, height: 80 },
    { ...item, id: "far", x: 500, y: 500 },
  ];
  const copies = getVisibleRepeats(items, viewport, 1000, 1000, 0);
  assert.deepEqual(
    copies.map((copy) => copy.item.id),
    ["small"],
  );
  const moved = getVisibleRepeats(
    items,
    { ...viewport, positionX: -250 },
    1000,
    1000,
    0,
  );
  assert.deepEqual(
    moved.map((copy) => copy.item.id),
    ["wide"],
  );
});

test("very long pans preserve the pattern and a bounded number of DOM candidates", () => {
  const origin = getVisibleRepeats(
    [item],
    { ...viewport, width: 500, height: 300 },
    100,
    100,
    40,
  );
  for (const offset of [-1_000_000, 1_000_000]) {
    const copies = getVisibleRepeats(
      [item],
      {
        ...viewport,
        width: 500,
        height: 300,
        positionX: offset,
        positionY: -offset,
      },
      100,
      100,
      40,
    );
    assert.equal(copies.length, origin.length);
    assert.equal(new Set(copies.map((copy) => copy.key)).size, copies.length);
    assert.deepEqual(
      copies.map((copy) => [copy.x + offset, copy.y - offset]),
      origin.map((copy) => [copy.x, copy.y]),
    );
  }
});

test("a copy crossing a period seam stays continuous", () => {
  const scene = { ...item, x: 75, y: 20, width: 50, height: 60 };
  const before = getVisibleRepeats(
    [scene],
    { ...viewport, width: 20, positionX: -99 },
    100,
    100,
    0,
  );
  const after = getVisibleRepeats(
    [scene],
    { ...viewport, width: 20, positionX: -101 },
    100,
    100,
    0,
  );
  assert.equal(before.length, 1);
  assert.equal(after.length, 1);
  assert.equal(before[0].key, after[0].key);
  assert.equal(before[0].x, after[0].x);
});

test("empty viewports render nothing and invalid dimensions are rejected", () => {
  assert.deepEqual(
    getVisibleRepeats([item], { ...viewport, width: 0 }, 100, 100),
    [],
  );
  assert.deepEqual(getVisibleRepeats([], viewport, 100, 100), []);
  for (const scale of [0, -1, Infinity, NaN]) {
    assert.throws(() =>
      getVisibleRepeats([item], { ...viewport, scale }, 100, 100),
    );
  }
  assert.throws(() => getVisibleRepeats([item], viewport, 0, 100));
  assert.throws(() => getVisibleRepeats([item], viewport, 100, 100, -1));
  assert.throws(() =>
    getVisibleRepeats([{ ...item, width: 0 }], viewport, 100, 100),
  );
});
