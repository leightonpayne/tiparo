# Adding Fonts

## 1. Create the folder layout

```yaml
tiparo
└─ content/
   ├─ fonts/
   │  └─ <font-id>/ # (1)!
   └─ upstreams/
      └─ <font-id>/ # (2)!
```

1.  Metadata and preview assets only
2.  Full upstream source tree

## 2. Write `family.toml`

Create:

```text
content/fonts/<font-id>/family.toml
```

At minimum:

- metadata in `[details]`
- `archive` and `archive_version` in `[source]`
- one or more `[style.<id>]` sections

Recommended:

- prefer `woff2` preview files
- set `[display].style`
- include `repository` and `commit`

## 4. Sync preview assets

Run:

```bash
bun run fonts:sync -- <font-id>
```

This script:

1. reads `family.toml`
2. gathers every `style.*.file`
3. copies only those font files from the full upstream
4. writes them to `content/fonts/<font-id>/`

This is the step that keeps the tracked repo small.

## 5. Regenerate the app manifest

Run:

```bash
bun run content:sync
```

That rebuilds:

```text
src/data/generated-font-library.ts
```

## 6. Verify in the app

Run:

```bash
bun run dev
```

Then verify:

- the family appears
- the preferred preview style is correct
- the detail page loads every face
- metadata and links look right

## Common mistakes

### Missing synced asset

If the app generator says a font file is missing, either:

- the `file` path in `family.toml` is wrong
- or you forgot to rerun `fonts:sync`

### Wrong preview format

If the repo gets heavy quickly, check whether you accidentally referenced large OTF or TTF files instead of `woff2`.

### Too much tracked content

If you copied the full upstream into `content/fonts/<font-id>/`, you skipped the intended split. The tracked font directory should stay selective.
