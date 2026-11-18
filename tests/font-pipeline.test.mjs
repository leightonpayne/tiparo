import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function createFixture(t, spec) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "tiparo-font-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(path.join(repoRoot, "scripts"), path.join(root, "scripts"), { recursive: true });
  await writeFixtureFile(root, "content/fonts/demo/family.json", JSON.stringify(spec));
  await fs.mkdir(path.join(root, "content/upstreams/demo"), { recursive: true });
  await fs.mkdir(path.join(root, "src/data"), { recursive: true });
  return root;
}

async function writeFixtureFile(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents);
}

function runScript(root, script, args = [], nodeArgs = []) {
  return execFileAsync(process.execPath,
    [...nodeArgs, path.join(root, "scripts", script), ...args], { cwd: root });
}

async function readGeneratedFamily(root) {
  const manifest = await fs.readFile(path.join(root, "src/data/generated-font-library.ts"), "utf8");
  return JSON.parse(manifest.slice(manifest.indexOf("= ") + 2).trim().replace(/;$/, ""))[0];
}

const syncSpec = {
  details: { name: "Demo" },
  style: {
    Regular400: { file: "web/regular.woff2" },
    Bold700: { file: "web/bold.woff2" },
  },
};

async function createSyncFixture(t) {
  const root = await createFixture(t, syncSpec);
  await writeFixtureFile(root, "content/fonts/demo/web/regular.woff2", "old regular");
  await writeFixtureFile(root, "content/fonts/demo/web/bold.woff2", "old bold");
  await writeFixtureFile(root, "content/upstreams/demo/web/regular.woff2", "new regular");
  return root;
}

async function assertOriginalPreviews(root) {
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, "content/fonts/demo/family.json"), "utf8")), syncSpec);
  assert.equal(await fs.readFile(path.join(root, "content/fonts/demo/web/regular.woff2"), "utf8"), "old regular");
  assert.equal(await fs.readFile(path.join(root, "content/fonts/demo/web/bold.woff2"), "utf8"), "old bold");
}

test("sync preserves existing previews when a later upstream asset is missing", async (t) => {
  const root = await createSyncFixture(t);
  await assert.rejects(runScript(root, "sync-font-assets.mjs", ["demo"]),
    /Missing upstream asset for "demo": web\/bold\.woff2/);
  await assertOriginalPreviews(root);
});

test("sync preserves existing previews when staging a copy fails", async (t) => {
  const root = await createSyncFixture(t);
  await writeFixtureFile(root, "content/upstreams/demo/web/bold.woff2", "new bold");
  await writeFixtureFile(root, "fail-copy.mjs", `
import { promises as fs } from "node:fs";
const copyFile = fs.copyFile;
fs.copyFile = async (source, ...args) => {
  if (source.endsWith("bold.woff2")) throw new Error("simulated copy failure");
  return copyFile(source, ...args);
};
`);
  await assert.rejects(runScript(root, "sync-font-assets.mjs", ["demo"], ["--import", path.join(root, "fail-copy.mjs")]),
    /simulated copy failure/);
  await assertOriginalPreviews(root);
});

test("sync restores the original directory if installing staged previews fails", async (t) => {
  const root = await createSyncFixture(t);
  await writeFixtureFile(root, "content/upstreams/demo/web/bold.woff2", "new bold");
  await writeFixtureFile(root, "fail-install.mjs", `
import { promises as fs } from "node:fs";
import path from "node:path";
const rename = fs.rename;
fs.rename = async (source, ...args) => {
  if (path.basename(source) === "next") throw new Error("simulated installation failure");
  return rename(source, ...args);
};
`);
  await assert.rejects(runScript(root, "sync-font-assets.mjs", ["demo"], ["--import", path.join(root, "fail-install.mjs")]),
    /simulated installation failure/);
  await assertOriginalPreviews(root);
  assert.deepEqual((await fs.readdir(path.join(root, "content"))).sort(), ["fonts", "upstreams"]);
});

test("successful sync replaces selected previews and removes stale assets", async (t) => {
  const root = await createSyncFixture(t);
  await writeFixtureFile(root, "content/upstreams/demo/web/bold.woff2", "new bold");
  await writeFixtureFile(root, "content/fonts/demo/stale.woff2", "stale preview");
  await writeFixtureFile(root, "content/upstreams/demo/LICENSE", "upstream license");

  await runScript(root, "sync-font-assets.mjs", ["demo"]);

  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, "content/fonts/demo/family.json"), "utf8")), syncSpec);
  assert.equal(await fs.readFile(path.join(root, "content/fonts/demo/web/regular.woff2"), "utf8"), "new regular");
  assert.equal(await fs.readFile(path.join(root, "content/fonts/demo/web/bold.woff2"), "utf8"), "new bold");
  assert.deepEqual((await fs.readdir(path.join(root, "content/fonts/demo"))).sort(), ["family.json", "web"]);
  assert.deepEqual((await fs.readdir(path.join(root, "content"))).sort(), ["fonts", "upstreams"]);
});

test("sync rejects paths and symlinks outside the family directory", async (t) => {
  const root = await createSyncFixture(t);
  await writeFixtureFile(root, "content/upstreams/demo/web/bold.woff2", "new bold");
  await writeFixtureFile(root, "outside.woff2", "outside font");
  const regular = path.join(root, "content/upstreams/demo/web/regular.woff2");
  await fs.unlink(regular);
  await fs.symlink(path.join(root, "outside.woff2"), regular);
  await assert.rejects(runScript(root, "sync-font-assets.mjs", ["demo"]), /escapes its family directory/);
  await assertOriginalPreviews(root);

  await writeFixtureFile(root, "content/fonts/demo/family.json",
    JSON.stringify({ style: { Regular400: { file: "../outside.woff2" } } }));
  await assert.rejects(runScript(root, "sync-font-assets.mjs", ["demo"]), /family-relative file path/);
  assert.equal(await fs.readFile(path.join(root, "content/fonts/demo/web/regular.woff2"), "utf8"), "old regular");
});

test("manifest preserves metadata and generates distinct faces with inferred weights", async (t) => {
  const root = await createFixture(t, {
    details: { name: 'Démö "Font"', designer: ["Alice", "Bob"], designer_url: ["https://alice.example"] },
    source: { archive: "https://example.com/abc123/font.zip", repository: "https://example.com/source", commit: "1.0" },
    display: { style: "display regular 400" },
    specimen: { force_lowercase: true, supported: ["abc", " "], replace_punctuation: "*" },
    style: {
      Bold700Italic: { file: "Font Files/bold.woff2" },
      Regular400: { file: "regular.TTF" },
      DisplayRegular400: { name: "Display Regular 400", file: "display.otf" },
      Explicit900: { name: "Medium 500", file: "regular.TTF" },
      Edition1700: { file: "regular.TTF" },
    },
  });
  for (const file of ["Font Files/bold.woff2", "regular.TTF", "display.otf"]) {
    await writeFixtureFile(root, `content/fonts/demo/${file}`, "fixture font");
  }

  await runScript(root, "generate-font-manifest.mjs");

  const font = await readGeneratedFamily(root);
  assert.equal(font.family, 'Démö "Font"');
  assert.equal(font.designer, "Alice, Bob");
  assert.deepEqual(font.designers, [{ name: "Alice", url: "https://alice.example" }, { name: "Bob" }]);
  assert.equal(font.links.download, "https://example.com/abc123/font.zip");
  assert.equal(font.links.official, "https://example.com/source");
  assert.equal(font.version, "1.0");
  assert.deepEqual(font.specimen.supportedGlyphs, ["abc", " "]);
  assert.deepEqual(font.faces.map(({ weight }) => weight), ["700", "400", "400", "500", "400"]);
  assert.equal(font.faces[0].style, "italic");
  assert.equal(new Set(font.faces.map(({ fontFamily }) => fontFamily)).size, 5);
  assert.equal(font.previewFamily, font.faces[2].fontFamily);
  const css = await fs.readFile(path.join(root, "src/data/generated-fonts.css"), "utf8");
  assert.equal((css.match(/@font-face/g) ?? []).length, 5);
  assert.match(css, /Font%20Files\/bold\.woff2/);
  assert.match(css, /format\("truetype"\)/);
  assert.match(css, /format\("opentype"\)/);
  assert.match(css, /font-display: swap/);
});

test("preview falls back to normal 400, then to the first face", async (t) => {
  for (const [styles, expected] of [
    [{ Bold700: { file: "font.woff2" }, Regular400: { file: "font.woff2" } }, "Regular400"],
    [{ Bold700: { file: "font.woff2" }, Light300: { file: "font.woff2" } }, "Bold700"],
  ]) {
    const root = await createFixture(t, { display: { style: "missing" }, style: styles });
    await writeFixtureFile(root, "content/fonts/demo/font.woff2", "fixture font");
    await runScript(root, "generate-font-manifest.mjs");
    const font = await readGeneratedFamily(root);
    assert.equal(font.previewFamily, font.faces.find(({ id }) => id === expected).fontFamily);
  }
});

test("generation rejects missing assets and unresolved archive URLs", async (t) => {
  const root = await createFixture(t, { source: { archive: "font.tar.gz" }, style: { Regular400: { file: "font.woff2" } } });
  await assert.rejects(runScript(root, "generate-font-manifest.mjs"), /ENOENT/);
  await writeFixtureFile(root, "content/fonts/demo/font.woff2", "fixture font");
  await assert.rejects(runScript(root, "generate-font-manifest.mjs"), /absolute HTTP\(S\) source.archive URL/);
});
