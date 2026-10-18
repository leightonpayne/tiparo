---
icon: lucide/download
---

# Installation

## Local development

Install Node.js 24 or newer and [aube](https://aube.sh/) 2.1.0, then clone the
repository and install the JavaScript dependencies:

```bash
git clone https://github.com/leightonpayne/tiparo
cd tiparo
aube install
```

Start the app locally:

```bash
aube run dev
```

Start and make accessible over tailnet:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=<MagicDNS> aube run dev --host
```

## Docs toolchain

The docs site is built with Zensical and managed with `uv`:

```bash
uv sync
aube run docs:serve
```

## Build commands

App only:

```bash
aube run build
```

Docs only:

```bash
aube run docs:build
```

That writes the docs output to `dist/docs/`.

Combined GitHub Pages artifact:

```bash
aube run pages:build
```

That command builds the app into `dist/`, then builds the docs directly into
`dist/docs/` so GitHub Pages can serve both from one deployment.

Use `pages:build` when you want the final deploy-shaped artifact. Running
`aube run build` after `aube run docs:build` will rebuild `dist/` for the app and
remove the docs output until you build them again.
