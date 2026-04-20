# `family.toml`

Each font family is defined by:

```text
content/fonts/<font-id>/family.toml
```

This file is the authoritative source for:

- display metadata
- preview face definitions
- archive naming and versioning
- upstream provenance

## Top-level sections

Tiparo currently uses these sections:

- `[details]`
- `[source]`
- `[display]`
- `[style.<id>]`

## `[details]`

Human-facing metadata used in the UI:

```toml
[details]
name = "Inter"
designer = "Rasmus Andersson"
designer_url = "https://rsms.me/"
license = "SIL Open Font License 1.1"
license_url = "http://scripts.sil.org/OFL"
copyright = "Copyright 2016, The Inter Project Authors"
foundry = "Independent"
website = "https://rsms.me/inter/"
```

Notes:

- `designer` and `designer_url` may be either a string or a string array.
- The generator normalizes these into the structured `designers` array used by the app.

## `[source]`

Packaging, download, and provenance data:

```toml
[source]
repository = "https://gitlab.com/velvetyne/basteleur"
commit = "f32302d63d46e9b996f329648b0f2df01c9190f5"
archive = "tiparo-basteleur.tar.gz"
archive_version = "abc1234"
```

### `archive`

This is either:

- a relative tarball filename, which Tiparo turns into an R2 URL
- or an absolute URL, which the app uses directly

Relative archives are resolved as:

```text
<archive-config.baseUrl>/<archive_version>/<archive>
```

### `archive_version`

This is a short hash path segment used to version the external download URL.

It matters because the app expects a stable URL for the currently published archive, while allowing the content of that archive to change over time.

## `[display]`

The preferred preview face for list/grid display:

```toml
[display]
style = "Regular400"
```

The runtime loader tries to match this value against:

- the `[style.<id>]` table name
- or the style `name`

If it is missing, the app falls back to the first normal 400 face it can find.

## `[style.<id>]`

One section per previewable face:

```toml
[style.Regular400]
name = "Regular 400"
file = "inter/web/Inter-Regular.woff2"
```

Optional for collections:

```toml
[style.SomeFace]
name = "Some Face"
file = "some/font.ttc"
index = 2
```

### `file`

This path is relative to the full upstream layout, not the tracked font directory.

During sync and generation, Tiparo normalizes it to a path inside:

```text
content/fonts/<font-id>/
```

## Practical guidance

- Prefer `woff2` for preview files.
- Keep preview definitions aligned with the actual files copied by `fonts:sync`.
- Treat `family.toml` as content, not generated output.
- If you change `family.toml`, regenerate the runtime manifest before trusting the app state.
