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

## Docs toolchain

The docs site is built with Zensical and managed with `uv`:

```bash
uv python pin 3.14
uv sync --group docs
```

Then run:

```bash
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

Combined GitHub Pages artifact:

```bash
bun run pages:build
```

That command builds the app into `dist/`, builds the docs into `site/`, and then copies the docs site into `dist/docs/` so GitHub Pages can serve both from one deployment.
