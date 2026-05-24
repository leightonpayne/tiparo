---
icon: lucide/type
---

# Tiparo Architecture

Tiparo has two separate concerns:

1. The app UI, which is served as a static Vite build.
2. The font content pipeline, which converts local font metadata and preview
   assets into a generated TypeScript manifest consumed by the app.

At a high level, the flow is:

1. You define a font in `content/fonts/<font-id>/family.toml`.
2. You keep the full original upstream source tree in
   `content/upstreams/<font-id>/`.
3. You sync only the preview font files into `content/fonts/<font-id>/`.
4. A generator script reads every `family.toml` file and emits a typed
   `fontLibrary` manifest for the app.
5. The React app imports that manifest and renders the library and detail views.
6. Local preview fonts are loaded at runtime by injecting `@font-face` rules
   into `document.head`.
7. Full upstream archives are packaged and uploaded separately to R2, and the
   app links to those external archive URLs for download.

## Directory Layout

The important directories are:

```text
.
├── content
│   ├── archive-config.json
│   ├── fonts
│   │   └── <font-id>
│   │       ├── family.toml
│   │       └── ...preview font files
│   └── upstreams
│       └── <font-id>
│           └── ...full upstream tree, ignored by git
├── public
│   ├── CNAME
│   └── tiparo.svg
├── scripts
│   ├── generate-font-manifest.mjs
│   ├── publish-font-archive.mjs
│   ├── set-archive-version.mjs
│   ├── sync-font-assets.mjs
│   └── lib/font-spec.mjs
└── src
    ├── App.tsx
    ├── components
    ├── data
    │   ├── font-library.ts
    │   ├── fonts.ts
    │   └── generated-font-library.ts
    └── lib
        └── font-loader.ts
```

## Build And Runtime Model

### Development and production commands

The main scripts are defined in
[`package.json`](https://github.com/leightonpayne/tiparo/blob/main/package.json):

- `bun run dev` Runs `content:sync` first, then starts the Vite dev server.
- `bun run build` Runs `content:sync`, TypeScript build checks, and then
  `vite build`.
- `bun run preview` Runs `content:sync`, then serves the built app with
  `vite preview`.
- `bun run content:sync` Runs
  [`scripts/generate-font-manifest.mjs`](https://github.com/leightonpayne/tiparo/blob/main/scripts/generate-font-manifest.mjs).
- `bun run fonts:sync -- <font-id>` Copies preview assets from ignored full
  upstreams into tracked preview directories.
- `bun run fonts:publish -- <font-id> --bucket <bucket>` Packages the full
  upstream, uploads it to R2, updates `archive_version`, and regenerates the
  manifest.
- `bun run archives:set-version -- <font-id> <short-hash>` Updates
  `source.archive_version` manually in the target `family.toml`.

### Vite base path behavior

[`vite.config.ts`](https://github.com/leightonpayne/tiparo/blob/main/vite.config.ts)
calculates the app base path with `resolveBasePath()`:

- if `VITE_BASE_PATH` is set, that value wins
- otherwise, local development uses `/`
- otherwise, GitHub Actions falls back to a project-site path derived from
  `GITHUB_REPOSITORY`

The GitHub Pages workflow currently forces `VITE_BASE_PATH="/"`, because the
intended public hostname is a custom domain, not `/tiparo/`.

## App Structure

### Entry points

- [`src/main.tsx`](https://github.com/leightonpayne/tiparo/blob/main/src/main.tsx)
  mounts the React app and imports the global CSS.
- [`src/App.tsx`](https://github.com/leightonpayne/tiparo/blob/main/src/App.tsx)
  is the main application shell.

### Routing model

Tiparo uses hash routing, not React Router.

The route parsing logic lives directly in
[`src/App.tsx`](https://github.com/leightonpayne/tiparo/blob/main/src/App.tsx):

- `#/` means the library view
- `#/fonts/<font-id>` means the detail view for one font

`App` stores the current route in local component state and updates it on
`hashchange`. This keeps the deployment simple on GitHub Pages, because the
server only has to serve one `index.html`.

### Main screens

The app has two top-level states:

1. Library view Rendered directly by
   [`src/App.tsx`](https://github.com/leightonpayne/tiparo/blob/main/src/App.tsx)
   using either:
   - [`src/components/font-list-row.tsx`](https://github.com/leightonpayne/tiparo/blob/main/src/components/font-list-row.tsx)
   - [`src/components/font-card.tsx`](https://github.com/leightonpayne/tiparo/blob/main/src/components/font-card.tsx)

2. Font detail view Rendered by
   [`src/components/font-detail-page.tsx`](https://github.com/leightonpayne/tiparo/blob/main/src/components/font-detail-page.tsx)

The library view:

- reads `fontLibrary`
- filters fonts by search query
- toggles between list and grid display
- shares a single specimen text state across all cards/rows
- eagerly loads preview faces for visible fonts

The detail view:

- calls `ensureFontLoaded(font)` on mount
- shows metadata and external links
- renders large, medium, and small specimen editors
- renders a styles section showing every face in the font family
- exposes the external archive URL as the Download button target

### Editable specimen fields

[`src/components/editable-specimen-text.tsx`](https://github.com/leightonpayne/tiparo/blob/main/src/components/editable-specimen-text.tsx)
is the reusable textarea-based specimen control.

It supports two modes:

- multi-line preview fields
- single-line scrolling preview fields with a fading edge mask

This component is used in the library rows/cards and on the detail page. It
resizes itself for multiline content and recalculates the fade mask for
single-line content.

## Data Model

### Generated runtime data

The app imports `fontLibrary` via
[`src/data/font-library.ts`](https://github.com/leightonpayne/tiparo/blob/main/src/data/font-library.ts),
which simply re-exports the generated file.

The generated file:

- imports the preview asset files as Vite asset URLs
- builds a typed `FontEntry[]`
- includes metadata, display settings, preview faces, and the resolved external
  archive URL

The runtime type is defined in
[`src/data/fonts.ts`](https://github.com/leightonpayne/tiparo/blob/main/src/data/fonts.ts).

The important `FontEntry` fields are:

- `id` Stable internal identifier, usually the folder name.
- `family` Display name of the family.
- `designers` Structured designer records with optional URLs.
- `source` In current practice this is `type: "local"`, with a `faces` array
  describing the preview files.
- `links` Public URLs for source repo, official site, and download archive.
- `display.style` Optional preferred preview style id/name.
- `upstream` Source repository, download URL, and upstream commit metadata.

### `family.toml`

Each font is declared by `content/fonts/<font-id>/family.toml`.

Current sections:

- `[details]` Human-facing metadata such as family name, designers, foundry,
  license, and website.
- `[source]` Packaging and provenance information.
- `[display]` The preferred face for library previews.
- `[style.<id>]` One entry per previewable face.

Example shape:

```toml
[details]
name = "Inter"
designer = "Rasmus Andersson"

[source]
archive = "tiparo-inter.tar.gz"
archive_version = "abc1234"

[display]
style = "Regular400"

[style.Regular400]
name = "Regular 400"
file = "inter/web/Inter-Regular.woff2"
```

Important fields in `[source]`:

- `archive` Usually a relative tarball filename such as `tiparo-inter.tar.gz`.
- `archive_version` A short hash used as the URL path segment for cache-busting
  and versioning.
- `repository` Optional upstream repository URL.
- `commit` Optional upstream commit hash or source revision.

Important fields in `[style.<id>]`:

- `name` Human-readable name.
- `file` Relative path to the preview font file inside the full upstream tree.
- `index` Optional font collection index for TTC files.

### TOML parser

The app itself does not read TOML in the browser. TOML is parsed ahead of time
by build scripts, and the result is written to
[`src/data/generated-font-library.ts`](https://github.com/leightonpayne/tiparo/blob/main/src/data/generated-font-library.ts).

Tiparo uses a small custom TOML subset parser in
[`scripts/lib/font-spec.mjs`](https://github.com/leightonpayne/tiparo/blob/main/scripts/lib/font-spec.mjs).

It supports the patterns used by the repository:

- string values
- numeric values
- booleans
- arrays
- nested tables using `[section]` and `[section.subsection]`

This parser is intentionally narrow. It is not a full TOML implementation. If
you add more advanced TOML syntax, the scripts may fail.

## How Preview Fonts Are Served

### Tracked preview assets

The preview assets live directly in `content/fonts/<font-id>/`.

These are committed to git and bundled into the Vite build. The app does not
fetch preview fonts from R2. They are part of the site itself.

### Generated imports

During `content:sync`,
[`scripts/generate-font-manifest.mjs`](https://github.com/leightonpayne/tiparo/blob/main/scripts/generate-font-manifest.mjs)
does this for every `style.*.file` entry:

1. Resolves the file path relative to `content/fonts/<font-id>/`
2. Verifies that the file exists
3. Adds an import like `...?url` into `generated-font-library.ts`
4. Emits a face entry with:
   - `path`
   - `weight`
   - `style`
   - `format`
   - `collectionIndex`

The end result is that the browser receives Vite-managed URLs to preview font
files.

### Runtime font loading

The runtime font-loading logic is in
[`src/lib/font-loader.ts`](https://github.com/leightonpayne/tiparo/blob/main/src/lib/font-loader.ts).

It has two loading modes:

- `preview` Loads only the default display face used for library previews.
- `full` Loads every local face for the selected family.

The loader keeps a `loadedFontModes` map keyed by font id. For local fonts it
injects a `<style data-tiparo-font="...">` element into `document.head`.

For each local face, it creates `@font-face` rules with synthetic family names
like:

```text
tiparo-inter-0
tiparo-inter-1
tiparo-inter-2
```

The library view uses `ensureFontPreviewsLoaded()` so only preview faces are
registered initially. The detail page upgrades a font to `full` mode by calling
`ensureFontLoaded(font)`.

This is the main performance optimization in the current runtime model: the app
ships all preview assets in the bundle, but it avoids registering all faces
until they are needed.

## How Download Archives Are Served

Tiparo treats downloadable archives separately from preview assets.

Preview assets:

- live in the repo
- are bundled by Vite
- are used only for in-browser previews

Download archives:

- are built from the full upstream tree in `content/upstreams/<font-id>/`
- are uploaded to R2
- are linked from the UI as external URLs

The shared external base URL is configured in
[`content/archive-config.json`](https://github.com/leightonpayne/tiparo/blob/main/content/archive-config.json):

```json
{
  "baseUrl": "https://downloads.leightonpayne.dev/tiparo"
}
```

If `source.archive` is relative and `source.archive_version` is set, the
generator resolves the final download URL as:

```text
<baseUrl>/<archive_version>/<archive>
```

For example:

```text
https://downloads.leightonpayne.dev/tiparo/abc1234/tiparo-inter.tar.gz
```

If `source.archive` is already an absolute URL, the generator uses it directly.

## Adding A New Font

This is the intended workflow for a new family.

### 1. Add the full upstream locally

Create:

```text
content/upstreams/<font-id>/
```

This directory is ignored by git. It is the source of truth for packaging and
preview extraction.

Include the full upstream tree here:

- source files
- binaries
- docs
- licenses
- any other files you may want in the downloadable archive

### 2. Create the font definition

Create:

```text
content/fonts/<font-id>/family.toml
```

At minimum, define:

- `[details]`
- `[source]`
- at least one `[style.<id>]` entry

Recommended:

- use `woff2` files for preview entries
- set `[display].style` so the library uses the intended face
- set `source.repository` and `source.commit` for provenance

### 3. Sync tracked preview assets

Run:

```bash
bun run fonts:sync -- <font-id>
```

[`scripts/sync-font-assets.mjs`](https://github.com/leightonpayne/tiparo/blob/main/scripts/sync-font-assets.mjs)
will:

1. Read `family.toml`
2. Collect every `style.*.file`
3. Remove the existing tracked files under `content/fonts/<font-id>/`, except
   `family.toml`
4. Copy only the required preview font files from `content/upstreams/<font-id>/`
   into the tracked font directory

This keeps the git-tracked content light while preserving the full upstream
locally.

### 4. Regenerate the runtime manifest

Run:

```bash
bun run content:sync
```

This updates
[`src/data/generated-font-library.ts`](https://github.com/leightonpayne/tiparo/blob/main/src/data/generated-font-library.ts),
which is what the app actually imports.

If you run `bun run dev` or `bun run build`, this happens automatically.

### 5. Verify locally

Run:

```bash
bun run dev
```

Then check:

- the font appears in the library
- search works
- the intended default preview face is used
- the detail page loads all styles correctly
- the metadata fields display as expected

## Publishing A Font Archive

To publish one family’s full upstream archive to R2, run:

```bash
bun run fonts:publish -- <font-id> --bucket <bucket-name>
```

For real uploads, Wrangler must already be authenticated locally or have
`CLOUDFLARE_API_TOKEN` set in the environment.

[`scripts/publish-font-archive.mjs`](https://github.com/leightonpayne/tiparo/blob/main/scripts/publish-font-archive.mjs)
does the following:

1. Reads `family.toml`
2. Verifies that `source.archive` is present and relative
3. Runs `fonts:sync` for that font first
4. Creates a temporary `.tar.gz` from `content/upstreams/<font-id>/`
5. Computes a short SHA-256 hash
6. Uploads the archive to R2 via Wrangler
7. Writes the hash back into `source.archive_version`
8. Regenerates `generated-font-library.ts`

The uploaded object key is derived from the configured base path plus the short
hash:

```text
tiparo/<hash>/<archive-name>
```

The script also sets useful object metadata:

- `Content-Type: application/gzip`
- `Content-Disposition: attachment; filename="..."`
- `Cache-Control: public, max-age=31536000, immutable`

### Dry runs

You can inspect the result without uploading:

```bash
bun run fonts:publish -- inter --dry-run
```

This prints:

- temporary archive path
- computed short hash
- R2 object key
- final public URL

### Manual version updates

If you need to set the archive version yourself, use:

```bash
bun run archives:set-version -- inter abc1234
```

[`scripts/set-archive-version.mjs`](https://github.com/leightonpayne/tiparo/blob/main/scripts/set-archive-version.mjs)
updates only the `archive_version` line in the target `family.toml`.

## Deployment

### App hosting

The app and docs are deployed together via GitHub Pages using the workflow at
[`.github/workflows/deploy-pages.yml`](https://github.com/leightonpayne/tiparo/blob/main/.github/workflows/deploy-pages.yml).

The workflow:

1. checks out the repo
2. installs dependencies with Bun
3. syncs the docs environment with `uv`
4. runs `bun run pages:build`
5. uploads `dist/`
6. deploys to GitHub Pages

`pages:build` builds the app into `dist/`, then builds the docs directly into
`dist/docs/`.

The custom domain is declared in
[`public/CNAME`](https://github.com/leightonpayne/tiparo/blob/main/public/CNAME):

```text
tiparo.leightonpayne.dev
```

### Download hosting

Download archives are not served from GitHub Pages. They are served from
Cloudflare R2 behind:

```text
https://downloads.leightonpayne.dev/tiparo
```

That separation is intentional:

### Public URLs

- app: `https://tiparo.leightonpayne.dev/`
- docs: `https://tiparo.leightonpayne.dev/docs/`
- downloads: `https://downloads.leightonpayne.dev/tiparo`

- GitHub Pages serves the UI
- R2 serves large downloadable archives

## Failure Modes And Gotchas

### Missing preview asset

If a `style.*.file` path in `family.toml` does not exist under the tracked font
directory, `generate-font-manifest.mjs` fails.

Usual fix:

```bash
bun run fonts:sync -- <font-id>
```

### Missing full upstream

If `content/upstreams/<font-id>/` is missing, `fonts:sync` and `fonts:publish`
fail.

### Missing `archive_version`

If `source.archive` is relative and `archive_version` is missing, the manifest
generator fails, because it cannot build the public download URL.

### Custom TOML limits

The parser only supports the TOML subset used here. Avoid advanced TOML features
unless you also extend the parser.

### Generated file is source of truth for the app

The browser never reads `family.toml` directly. If you change `family.toml` and
do not regenerate the manifest, the app will still reflect the old generated
data.

## Practical Maintenance Rules

If you want to keep the repo healthy, these are the rules that matter most:

1. Keep full upstreams in `content/upstreams/<font-id>/`, not in tracked app
   content.
2. Keep only preview font files under `content/fonts/<font-id>/`.
3. Use `woff2` for preview faces unless there is a strong reason not to.
4. Regenerate the manifest whenever `family.toml` or tracked preview assets
   change.
5. Publish downloadable archives to R2 instead of committing tarballs to the
   repo.
6. Treat `generated-font-library.ts` as generated output, not handwritten code.

## Short Operational Checklist

For day-to-day work:

1. Edit `family.toml`
2. Put the full upstream in `content/upstreams/<font-id>/`
3. Run `bun run fonts:sync -- <font-id>`
4. Run `bun run dev`
5. When ready to publish downloads, run
   `bun run fonts:publish -- <font-id> --bucket <bucket>`
6. Commit the tracked preview assets, TOML, generated manifest, and app changes
