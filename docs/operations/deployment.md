# Deployment

Tiparo has two delivery surfaces:

1. the app
2. the archive downloads

They are deployed separately.

## App deployment

The app is built with Vite and deployed with GitHub Pages.

Relevant files:

- [`.github/workflows/deploy-pages.yml`](https://github.com/leightonpayne/tiparo/blob/main/.github/workflows/deploy-pages.yml)
- [`vite.config.ts`](https://github.com/leightonpayne/tiparo/blob/main/vite.config.ts)
- [`public/CNAME`](https://github.com/leightonpayne/tiparo/blob/main/public/CNAME)
- [`scripts/assemble-pages-artifact.mjs`](https://github.com/leightonpayne/tiparo/blob/main/scripts/assemble-pages-artifact.mjs)

### Current public app URL

```text
https://tiparo.leightonpayne.dev
```

### Build behavior

The Pages workflow:

1. installs dependencies with Bun
2. syncs the docs environment with `uv`
3. runs `bun run pages:build`
4. uploads `dist/`
5. deploys the artifact to GitHub Pages

The workflow forces:

```text
VITE_BASE_PATH=/
```

That matches the custom-domain deployment model.

`bun run pages:build` does three things:

1. builds the app into `dist/`
2. builds the docs site into `site/`
3. copies the docs output into `dist/docs/`

That means one Pages deployment serves both:

- app at `/`
- docs at `/docs/`

## Download deployment

Download archives are hosted from Cloudflare R2 via:

```text
https://downloads.leightonpayne.dev/tiparo
```

This keeps large archives out of the GitHub Pages artifact and avoids mixing app hosting with file hosting.

## Why the split matters

GitHub Pages is a good fit for:

- HTML
- JS
- CSS
- bundled preview font assets

R2 is a better fit for:

- versioned archives
- large binary downloads
- cache-friendly immutable object URLs

## Docs deployment

The docs are deployed as part of the same GitHub Pages artifact.

Current public docs URL:

```text
https://tiparo.leightonpayne.dev/docs/
```

Relevant files:

- [`mkdocs.yml`](https://github.com/leightonpayne/tiparo/blob/main/mkdocs.yml)
- [`scripts/assemble-pages-artifact.mjs`](https://github.com/leightonpayne/tiparo/blob/main/scripts/assemble-pages-artifact.mjs)
- [`package.json`](https://github.com/leightonpayne/tiparo/blob/main/package.json)

Local commands:

```bash
bun run docs:serve
bun run docs:build
bun run pages:build
```

`docs:build` writes the standalone docs site to `site/`. `pages:build` is the deploy-shaped build that copies that output into `dist/docs/` before the Pages artifact is uploaded.
