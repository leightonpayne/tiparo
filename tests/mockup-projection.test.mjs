import assert from "node:assert/strict";
import test from "node:test";

import { getMockupSurfaceTransform } from "../src/lib/mockup-projection.ts";

function project(transform, [x, y]) {
  assert.match(transform, /^matrix3d\(.+\)$/);
  const matrix = transform.slice(9, -1).split(",").map(Number);
  assert.equal(matrix.length, 16);
  assert.ok(matrix.every(Number.isFinite));
  const divisor = matrix[3] * x + matrix[7] * y + matrix[15];
  return [
    (matrix[0] * x + matrix[4] * y + matrix[12]) / divisor,
    (matrix[1] * x + matrix[5] * y + matrix[13]) / divisor,
  ];
}

function assertPoint(actual, expected) {
  for (let axis = 0; axis < 2; axis += 1) {
    assert.ok(
      Math.abs(actual[axis] - expected[axis]) < 1e-7,
      `Expected ${expected}, received ${actual}`,
    );
  }
}

function assertCorners(points, width, height) {
  const transform = getMockupSurfaceTransform(points, width, height);
  const corners = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  corners.forEach((corner, index) =>
    assertPoint(project(transform, corner), points[index]),
  );
  return transform;
}

test("identity and translated rectangles preserve corners and their interior", () => {
  const identity = assertCorners(
    [
      [0, 0],
      [320, 0],
      [320, 180],
      [0, 180],
    ],
    320,
    180,
  );
  assertPoint(project(identity, [85, 120]), [85, 120]);

  const translated = assertCorners(
    [
      [40, -25],
      [680, -25],
      [680, 65],
      [40, 65],
    ],
    320,
    180,
  );
  assertPoint(project(translated, [85, 120]), [210, 35]);
});

test("rotated, skewed, and perspective paper corners project onto the photo", () => {
  for (const points of [
    [
      [200, 40],
      [440, 220],
      [260, 460],
      [20, 280],
    ],
    [
      [40, 20],
      [300, 60],
      [380, 240],
      [120, 200],
    ],
    [
      [40, 60],
      [330, 25],
      [290, 280],
      [85, 250],
    ],
    [
      [330, 25],
      [40, 60],
      [85, 250],
      [290, 280],
    ],
  ]) {
    assertCorners(points, 300, 420);
  }
});

test("perspective mapping also preserves interior positions", () => {
  const expectedProjection = ([x, y]) => {
    const divisor = 1 + 0.001 * x - 0.0006 * y;
    return [
      (1.1 * x - 0.35 * y + 80) / divisor,
      (0.2 * x + 0.9 * y + 20) / divisor,
    ];
  };
  const corners = [
    [0, 0],
    [320, 0],
    [320, 450],
    [0, 450],
  ];
  const transform = assertCorners(corners.map(expectedProjection), 320, 450);
  for (const point of [
    [160, 225],
    [80, 100],
    [300, 400],
  ]) {
    assertPoint(project(transform, point), expectedProjection(point));
  }
});

test("non-positive or non-finite print dimensions are rejected", () => {
  const points = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ];
  for (const dimension of [0, -1, NaN, Infinity, -Infinity]) {
    assert.throws(
      () => getMockupSurfaceTransform(points, dimension, 100),
      /finite positive/,
    );
    assert.throws(
      () => getMockupSurfaceTransform(points, 100, dimension),
      /finite positive/,
    );
  }
});

test("missing and non-finite photo coordinates are rejected", () => {
  for (const points of [
    null,
    [],
    Array(4),
    [
      [0, 0],
      [100, 0],
      [100, 100],
    ],
    [[0, 0], [100, 0], [100, 100], [0]],
    [[0, 0], [100, 0], [100, 100], Array(2)],
    [
      [0, 0],
      [100, 0],
      [100, NaN],
      [0, 100],
    ],
    [
      [0, 0],
      [Infinity, 0],
      [100, 100],
      [0, 100],
    ],
  ]) {
    assert.throws(
      () => getMockupSurfaceTransform(points, 100, 100),
      /four finite/,
    );
  }
});

test("collapsed, collinear, crossed, and concave surfaces are rejected", () => {
  for (const points of [
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [100, 0],
      [100, 0],
      [0, 100],
    ],
    [
      [0, 0],
      [50, 0],
      [100, 0],
      [0, 100],
    ],
    [
      [0, 0],
      [100, 0],
      [100, 1e-12],
      [0, 1e-12],
    ],
    [
      [0, 0],
      [100, 100],
      [100, 0],
      [0, 100],
    ],
    [
      [0, 0],
      [100, 0],
      [20, 20],
      [0, 100],
    ],
  ]) {
    assert.throws(
      () => getMockupSurfaceTransform(points, 100, 100),
      /non-degenerate convex/,
    );
  }
});

test("overflow cannot produce invalid CSS", () => {
  const points = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ];
  assert.throws(
    () => getMockupSurfaceTransform(points, Number.MIN_VALUE, 100),
    /not finite/,
  );
});
