---
icon: lucide/workflow
---

# Deployment

## App deployment

The app is built with Vite and deployed with GitHub Pages.

### Build behavior

The
[Pages workflow](https://github.com/leightonpayne/tiparo/blob/main/.github/workflows/deploy-pages.yml):

1. installs dependencies with Bun
2. syncs the docs environment with `uv`
3. runs `bun run pages:build`
4. uploads `dist/`
5. deploys the artifact to GitHub Pages

`bun run pages:build` does two things:

1. builds the app into `dist/`
2. builds the docs site directly into `dist/docs/`

That means one Pages deployment serves both:

- app at `/`
- docs at `/docs/`

## Download deployment

Download archives are hosted from Cloudflare R2 via:

```text
https://downloads.leightonpayne.dev/tiparo
```

## Docs deployment

The docs are deployed as part of the same GitHub Pages artifact.

```bash
bun run docs:serve
bun run docs:build
bun run pages:build
```

`docs:build` writes the docs site to `dist/docs/`. `pages:build` first builds
the app into `dist/`, then runs the docs build so GitHub Pages can serve the app
at `/` and the docs at `/docs/` from one artifact.
