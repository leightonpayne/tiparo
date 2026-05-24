---
icon: lucide/circle-plus
---

# Adding Fonts

## 1. Create the folder layout

Place the full upstream source tree under `upstreams/<font-id>/`, i.e.
everything that was bundled by the primary source of the font. This is what will
get uploaded to the S2 bucket.

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

Under `fonts/<font-id>/`. See the
[`family.toml` reference](/reference/family-toml/) for details.

## 3. Sync preview assets

This script reads `family.toml`, gathers every specified `style.*.file`, and
copies only those font files from the full upstream into
`content/fonts/<font-id>/` for the served previews.

```bash
bun run fonts:sync -- <font-id>
```

## 4. Regenerate the app manifest

This script rebuilds `src/data/generated-font-library.ts`.

```bash
bun run content:sync
```

## 5. Verify in the app

Verify that the family appears, the preferred preview style is correct, the
detail page loads every face, and the metadata and links look right.

```bash
bun run dev
```
