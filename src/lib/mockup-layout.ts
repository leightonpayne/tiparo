type FramedItem = {
  id: string;
  crop: { width: number; height: number };
};

/** Justified rows preserve the chosen framing and leave equal gaps at tile seams. */
export function layoutMockups<T extends FramedItem>(scenes: readonly T[]) {
  const worldWidth = 3600;
  const gap = 48;
  const items = [];
  let y = gap / 2;
  const rowCount = Math.ceil(scenes.length / 6);
  let start = 0;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const count =
      Math.floor(scenes.length / rowCount) +
      (rowIndex < scenes.length % rowCount ? 1 : 0);
    const row = scenes.slice(start, start + count);
    start += count;
    const ratios = row.map(({ crop }) => crop.width / crop.height);
    const photoHeight =
      (worldWidth - row.length * gap) / ratios.reduce((a, b) => a + b, 0);
    let x = gap / 2;
    for (let index = 0; index < row.length; index++) {
      const width = ratios[index] * photoHeight;
      items.push({
        ...row[index],
        x,
        y,
        width,
        height: photoHeight,
      });
      x += width + gap;
    }
    y += photoHeight + gap;
  }

  return { items, worldWidth, worldHeight: y - gap / 2 };
}
