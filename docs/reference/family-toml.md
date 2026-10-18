---
icon: lucide/file-cog
---

# `family.toml`

Each family lives at:

```text
content/fonts/<font-id>/family.toml
```

This file is the source of truth for:

- UI metadata
- preview face definitions
- download/archive metadata
- upstream provenance
- specimen sanitization rules

## Practical minimum

```toml
[details]
name = "Inter"

[source]
archive = "tiparo-inter.tar.gz"
archive_version = "abc1234"

[display]
style = "Regular400"

[style.Regular400]
name = "Regular 400"
file = "inter/web/Inter-Regular.woff2"
```

## Parser limits

Tiparo uses a small local parser, not a full TOML implementation. Keep this file
simple:

- use quoted strings, booleans, integers, and flat arrays
- use named tables like `[details]` and `[style.Regular400]`
- inline `# comments` are fine
- avoid multiline strings, inline tables, dates, and other advanced TOML forms

Unknown keys are currently ignored by the toolchain.

## Required in practice

- At least one `[style.<id>]` table must exist.
- Every `style.*.file` must resolve to a real synced asset before the app build
  passes.
- If `source.archive` is relative, `source.archive_version` is required for
  manifest generation.
- `source.archive` is required by `fonts:publish`.

## Top-level sections

Tiparo currently reads:

- `[details]`
- `[source]`
- `[display]`
- `[specimen]`
- `[style.<id>]`

## `[details]`

Human-facing metadata used in the app.

| Key            | Type                   | Use                                                     |
| -------------- | ---------------------- | ------------------------------------------------------- |
| `name`         | `string`               | Family name shown in the UI. Falls back to `<font-id>`. |
| `designer`     | `string` or `string[]` | Designer label.                                         |
| `designer_url` | `string` or `string[]` | Designer links, matched positionally with `designer`.   |
| `foundry`      | `string`               | Foundry label.                                          |
| `foundry_url`  | `string`               | Foundry link.                                           |
| `license`      | `string`               | License label.                                          |
| `license_url`  | `string`               | License link.                                           |
| `copyright`    | `string`               | Copyright text.                                         |
| `website`      | `string`               | Official family URL.                                    |

Example:

```toml
[details]
name = "Basteleur"
designer = ["Keussel", "George Triantafyllakos"]
designer_url = ["https://keussel.studio/", "https://backpacker.gr/"]
license = "SIL Open Font License 1.1"
license_url = "http://scripts.sil.org/OFL"
copyright = "Copyright 2021, Keussel"
foundry = "Velvetyne Type Foundry"
foundry_url = "https://velvetyne.fr/"
website = "https://velvetyne.fr/fonts/basteleur/"
```

## `[source]`

Packaging, download, and provenance fields.

| Key               | Type     | Use                                                 |
| ----------------- | -------- | --------------------------------------------------- |
| `repository`      | `string` | Upstream project/source link.                       |
| `commit`          | `string` | Upstream version/provenance marker.                 |
| `archive`         | `string` | Relative archive filename or absolute download URL. |
| `archive_version` | `string` | Version path segment for relative archives.         |

Example:

```toml
[source]
repository = "https://gitlab.com/velvetyne/basteleur"
commit = "f32302d63d46e9b996f329648b0f2df01c9190f5"
archive = "tiparo-basteleur.tar.gz"
archive_version = "2e9d0ec9"
```

Behavior:

- If `archive` is absolute, the app uses it as-is.
- If `archive` is relative, the download URL becomes:

```text
<archive-config.baseUrl>/<archive_version>/<archive>
```

- `repository` is used as the source link.
- `website` from `[details]` is preferred as the official link; otherwise the
  app falls back to `repository`.

## `[display]`

Preferred preview face for list/grid views.

| Key     | Type     | Use                      |
| ------- | -------- | ------------------------ |
| `style` | `string` | Preferred preview style. |

Example:

```toml
[display]
style = "Regular400"
```

Matching behavior:

- first matches a `[style.<id>]` table name
- then matches a style `name`
- otherwise the app falls back to the first normal 400-ish face it can infer

## `[specimen]`

Optional per-family preview sanitization rules.

| Key                   | Type                   | Use                                          |
| --------------------- | ---------------------- | -------------------------------------------- |
| `force_lowercase`     | `boolean`              | Lowercase the preview first.                 |
| `supported`           | `string` or `string[]` | Allowlist of glyphs or glyph groups.         |
| `unsupported`         | `string` or `string[]` | Blocklist of glyphs or glyph groups.         |
| `replace_punctuation` | `string`               | Replacement for Unicode punctuation.         |
| `note`                | `string`               | UI explanation shown with adjusted previews. |

Example:

```toml
[specimen]
force_lowercase = true
supported = ["abcdfghijklmnopqrstuvwxyz", " ", "*"]
replace_punctuation = "*"
note = "Unsupported glyphs are converted or dropped in the preview."
```

Order of operations:

1. lowercase
2. punctuation replacement
3. `supported` filtering
4. `unsupported` filtering

Notes:

- Include `" "` in `supported` if spaces should survive.
- Use this for font-specific preview constraints instead of hardcoding special
  cases in the UI.

## `[style.<id>]`

One table per previewable face.

| Key     | Type      | Use                                         |
| ------- | --------- | ------------------------------------------- |
| `name`  | `string`  | Face label. Defaults to `<id>` if omitted.  |
| `file`  | `string`  | Preview font path inside the upstream tree. |
| `index` | `integer` | Collection index for `.ttc` files.          |

Example:

```toml
[style.Regular400]
name = "Regular 400"
file = "inter/web/Inter-Regular.woff2"
```

Collection example:

```toml
[style.SomeFace]
name = "Some Face"
file = "some/font.ttc"
index = 2
```

Notes:

- `<id>` should be stable and human-readable. It is used by `display.style`, the
  runtime manifest, and debugging output.
- `file` is relative to the full upstream layout, not just the tracked
  `content/fonts/<font-id>/` directory.
- Tiparo normalizes `file` paths by stripping:
  - leading `./`
  - an optional `upstream/` prefix
  - an optional leading `<font-id>/` prefix
- Prefer `woff2` for previews. `woff`, `ttf`, `otf`, and `ttc` also work.
- Weight, italic style, and output format are inferred from the filename and
  style naming convention.

## Recommended conventions

- Put public-facing metadata in `[details]`, not in style names.
- Keep `display.style` equal to a style table id when possible.
- Keep style ids predictable, such as `Regular400` or `Bold700Italic`.
- Store only preview assets under `content/fonts/<font-id>/`; keep the full
  source tree in `content/upstreams/<font-id>/`.
- After editing `family.toml`, rerun the normal build flow or at least
  `aube run content:sync`.
