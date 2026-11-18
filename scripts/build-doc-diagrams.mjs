import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { render } from "pele";

const sources = new URL("../docs/diagrams/", import.meta.url);
const output = new URL("../docs/static/diagrams/", import.meta.url);
const diagrams = [];

for (const name of (await readdir(sources)).filter((name) => name.endsWith(".mmd")).sort()) {
  try {
    const { svg } = render(await readFile(new URL(name, sources), "utf8"), {
      fontSize: 16,
      padding: 24,
      config: { flowchart: { rankSpacing: 24, nodeSpacing: 16, curve: "step" } },
    });
    // External SVG images cannot inherit the docs page's CSS palette.
    const themed = svg.replace('style="', 'style="background:#fffcf0;--pele-bg:#fffcf0;--pele-fg:#100f0f;--pele-muted:#6f6e69;--pele-line:#6f6e69;--pele-surface:#f2f0e5;--pele-border:#cecdc3;');
    diagrams.push([name.replace(/\.mmd$/, ".svg"), themed]);
  } catch (cause) {
    throw new Error(`Invalid Pele diagram: ${name}`, { cause });
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const [name, svg] of diagrams) {
  await writeFile(new URL(name, output), `${svg}\n`);
}
console.log(`Rendered ${diagrams.length} documentation diagrams.`);
