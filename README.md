# Tiparo

<p align="center">
  <img src="public/tiparo.svg" width="30%" alt="tiparo logo">
</p>

## Overview

"Tiparo" (/tiˈpaɾo/) is a library of typefaces I personally like using. Tiparo means "Font" in [Esperanto](https://en.wikipedia.org/wiki/Esperanto).

Detailed architecture and content-pipeline documentation lives in [docs/operations/architecture.md](docs/operations/architecture.md).

There is also a dedicated Zensical docs site configured via [mkdocs.yml](mkdocs.yml) and deployed at `https://tiparo.leightonpayne.dev/docs/`.

## Development

```bash
git clone https://github.com/leightonpayne/tiparo
cd tiparo
```

```bash
bun install
bun run dev
```

## Documentation

The repo includes a standalone Zensical documentation site under `docs/`.

The Python side is managed with `uv`.

Recommended setup:

```bash
uv python pin 3.14
uv sync --group docs
```

Then run:

```bash
bun run docs:serve
```

Or build the static docs site:

```bash
bun run docs:build
```

## Deployment

- App: `https://tiparo.leightonpayne.dev`
- Docs: `https://tiparo.leightonpayne.dev/docs/`
- Downloads: `https://downloads.leightonpayne.dev/tiparo`

## Content structure

```text
content
├── fonts
│   └── {font}
│       ├── family.toml        <- tracked metadata and preview file references
│       └── {font files}       <- tracked preview font files only
└── upstreams                  <- ignored full upstream trees used for packaging
    └── {font}
        └── {full upstream}
```

Release archives are expected to be hosted externally and referenced from each font's `family.toml`.

Archive download URLs are generated from the shared base URL in [content/archive-config.json](content/archive-config.json) plus each font's own `source.archive_version` in `family.toml`.

For a new font:

1. Put the full upstream tree in `content/upstreams/{font}/`.
2. Create `family.toml` with local preview `style.*.file` entries.
3. Run `bun run fonts:sync -- {font}` to copy only the preview font files into `content/fonts/{font}/`.
4. Set `source.archive` to the tarball filename you will upload to R2, such as `tiparo-myfont.tar.gz`.
5. Publish with `bun run fonts:publish -- {font} --bucket your-r2-bucket`.

To update one font's tarball version manually:

```bash
bun run archives:set-version -- inter abc1234
```

The publish script computes a short hash from the tarball, uploads `content/upstreams/{font}` to R2 with Wrangler, updates `source.archive_version`, and regenerates the app data. It produces download URLs like:

```text
https://downloads.leightonpayne.dev/tiparo/abc1234/tiparo-inter.tar.gz
```

## License

Tiparo is licensed under [MIT](LICENSE).

The fonts distributed herein are licensed under different open licenses. This repo keeps only the preview font files in tracked font directories; original license and source materials remain in the local upstream trees and in the published archives.
