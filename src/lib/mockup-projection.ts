export type MockupPoint = readonly [number, number];
export type MockupSurface = readonly [
  MockupPoint,
  MockupPoint,
  MockupPoint,
  MockupPoint,
];

/** Maps a print plane onto photo corners (TL, TR, BR, BL), with transform-origin: 0 0. */
export function getMockupSurfaceTransform(
  points: MockupSurface,
  width: number,
  height: number,
): string {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(
      "Mockup surface dimensions must be finite positive numbers.",
    );
  }
  if (
    !Array.isArray(points) ||
    points.length !== 4 ||
    Array.from(points).some(
      (point) =>
        !Array.isArray(point) ||
        point.length !== 2 ||
        !Number.isFinite(point[0]) ||
        !Number.isFinite(point[1]),
    )
  ) {
    throw new Error(
      "Mockup surface needs four finite [x, y] points in TL, TR, BR, BL order.",
    );
  }

  const [[x0, y0], [x1, y1], , [x3, y3]] = points;
  const offsets = points.map(([x, y]) => [x - x0, y - y0]);
  const scale = Math.max(...offsets.flat().map(Math.abs));
  const invalidSurface =
    "Mockup surface points must form a non-degenerate convex quadrilateral.";
  if (!Number.isFinite(scale) || scale === 0) throw new Error(invalidSurface);

  // Normalize before checking area and solving, so the tolerance is independent of photo size.
  const normalized = offsets.map(([x, y]) => [x / scale, y / scale]);
  let orientation = 0;
  for (let index = 0; index < 4; index += 1) {
    const [ax, ay] = normalized[index];
    const [bx, by] = normalized[(index + 1) % 4];
    const [cx, cy] = normalized[(index + 2) % 4];
    const turn = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
    if (
      Math.abs(turn) <= 1e-10 ||
      (orientation && Math.sign(turn) !== orientation)
    ) {
      throw new Error(invalidSurface);
    }
    orientation = Math.sign(turn);
  }

  const [, [u1, v1], [u2, v2], [u3, v3]] = normalized;
  const dx1 = u1 - u2;
  const dx2 = u3 - u2;
  const dx3 = u2 - u1 - u3;
  const dy1 = v1 - v2;
  const dy2 = v3 - v2;
  const dy3 = v2 - v1 - v3;
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;

  // CSS stores matrices by column; g and h supply the perspective divide.
  const matrix = [
    (x1 - x0 + g * x1) / width,
    (y1 - y0 + g * y1) / width,
    0,
    g / width,
    (x3 - x0 + h * x3) / height,
    (y3 - y0 + h * y3) / height,
    0,
    h / height,
    0,
    0,
    1,
    0,
    x0,
    y0,
    0,
    1,
  ];
  if (!matrix.every(Number.isFinite)) {
    throw new Error(
      "Mockup surface transform is not finite; check its dimensions and points.",
    );
  }
  return `matrix3d(${matrix.join(", ")})`;
}
