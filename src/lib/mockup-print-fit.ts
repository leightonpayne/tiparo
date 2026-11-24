export function fitMockupPrint(print: HTMLDivElement) {
  // Leave a little room for scaled font-metric rounding. A line fitted exactly
  // against its boundary can otherwise wrap differently on a denser copy.
  const renderingGuard = 0.995;
  const headline = print.querySelector<HTMLElement>("h4");
  const main = print.querySelector<HTMLElement>(".mockup-print-main");
  const copy = print.querySelector<HTMLElement>(".mockup-print-copy");
  print.style.setProperty("--mockup-fit", "1");
  print.style.setProperty("--headline-fit", "1");
  // Long words need a smaller headline, not microscopic supporting copy.
  if (headline && headline.scrollWidth > headline.clientWidth + 1) {
    print.style.setProperty(
      "--headline-fit",
      String(headline.clientWidth / headline.scrollWidth),
    );
  }
  if (!main) return;
  const fits = () => {
    const style = getComputedStyle(main);
    const heights = Array.from(main.children, (child) => {
      const element = child as HTMLElement;
      const childStyle = getComputedStyle(element);
      return childStyle.display === "none" ? 0 : element.offsetHeight +
        parseFloat(childStyle.marginTop) + parseFloat(childStyle.marginBottom);
    }).filter((height) => height > 0);
    // Glyph overhangs can extend scroll bounds without occupying layout space.
    // Fit the actual type blocks rather than their painted vertical overflow.
    const needed = style.flexDirection === "row"
      ? Math.max(...heights, 0)
      : heights.reduce((sum, height) => sum + height, 0) +
        parseFloat(style.rowGap) * Math.max(0, heights.length - 1);
    // Large continuations can contain a word wider than the sheet even when
    // the headline fits, especially in symbol and restricted-character fonts.
    return needed <= main.clientHeight + 1 &&
      (!copy || copy.scrollWidth <= copy.clientWidth + 1);
  };
  if (fits()) {
    print.style.setProperty("--mockup-fit", String(renderingGuard));
    return;
  }
  // Wrapping changes in steps. Search for the largest fitting size instead of
  // shrinking once by an overflow ratio and leaving a nearly empty billboard.
  let lower = 0;
  let upper = 1;
  for (let attempt = 0; attempt < 10; attempt++) {
    const factor = (lower + upper) / 2;
    print.style.setProperty("--mockup-fit", String(factor));
    if (fits()) lower = factor;
    else upper = factor;
  }
  print.style.setProperty("--mockup-fit", String(lower * renderingGuard));
}
