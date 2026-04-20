# Runtime Manifest

The browser does not read `family.toml` directly.

Instead, the content pipeline generates:

```text
src/data/generated-font-library.ts
```

That file exports:

```ts
export const fontLibrary: FontEntry[]
```

The app imports it through:

- [`src/data/font-library.ts`](https://github.com/leightonpayne/tiparo/blob/main/src/data/font-library.ts)
- [`src/data/fonts.ts`](https://github.com/leightonpayne/tiparo/blob/main/src/data/fonts.ts)

## Why the manifest exists

The manifest isolates build-time content concerns from runtime UI concerns.

At generation time, Tiparo:

1. parses every `family.toml`
2. verifies that preview assets exist
3. imports preview files as Vite asset URLs
4. infers format, weight, and style metadata
5. resolves the external download URL
6. emits a typed TypeScript file

This keeps the browser-side app simple:

- no TOML parsing in the client
- no directory scanning at runtime
- no dynamic path guessing

## Shape of `FontEntry`

The key runtime fields are:

- `id`
  Stable font identifier.
- `family`
  Display name.
- `designer`
  Combined display string.
- `designers`
  Structured array of designer objects.
- `foundry`, `license`, `copyright`
  Human-facing metadata.
- `source`
  Usually `type: "local"` with the preview `faces` array.
- `links`
  Public URLs for official site, source repo, and download.
- `display.style`
  Preferred preview face.
- `upstream`
  Provenance information and resolved download URL.

## Local font faces

For local preview assets, each face includes:

- `id`
- `name`
- `file`
- `path`
- `weight`
- `style`
- `format`
- `collectionIndex`

`path` is the important part for the browser. It is already the final asset URL produced by Vite.

## Runtime consumption

The app uses the manifest in two main places:

1. [`src/App.tsx`](https://github.com/leightonpayne/tiparo/blob/main/src/App.tsx)
   Drives list/grid rendering and routing to detail pages.
2. [`src/lib/font-loader.ts`](https://github.com/leightonpayne/tiparo/blob/main/src/lib/font-loader.ts)
   Registers preview or full `@font-face` rules at runtime.

## Regeneration rules

You should regenerate the manifest when any of these change:

- `family.toml`
- tracked preview files under `content/fonts/<id>/`
- `content/archive-config.json`

Normally this happens through:

```bash
bun run content:sync
```

And automatically as part of:

```bash
bun run dev
bun run build
```
