---
icon: lucide/download
---

# Installation

## Local development

Clone the repository and install the JavaScript dependencies:

```bash
git clone https://github.com/leightonpayne/tiparo
cd tiparo
bun install
```

Start the app locally:

```bash
bun run dev
```

Start and make accessible over tailnet:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<MagicDNS> bun run dev --host
```

## Docs toolchain

The docs site is built with Zensical and managed with `uv`:

```bash
uv sync
bun run docs:serve
```

## Build commands

App only:

```bash
bun run build
```

Docs only:

```bash
bun run docs:build
```

That writes the docs output to `dist/docs/`.

Combined GitHub Pages artifact:

```bash
bun run pages:build
```

That command builds the app into `dist/`, then builds the docs directly into
`dist/docs/` so GitHub Pages can serve both from one deployment.

Use `pages:build` when you want the final deploy-shaped artifact. Running
`bun run build` after `bun run docs:build` will rebuild `dist/` for the app and
remove the docs output until you build them again.
