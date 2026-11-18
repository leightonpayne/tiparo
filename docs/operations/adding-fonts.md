---
icon: lucide/circle-plus
---

# Adding Fonts

1. Put the complete upstream release, including licenses, in
   `content/upstreams/<font-id>/` (ignored by git).
2. Create `content/fonts/<font-id>/family.json` using the
   [metadata reference](../reference/family-json.md). Record provenance, list
   preview faces (prefer static WOFF2), and choose `display.style`. File paths
   are relative to the family's directory, such as `web/Inter-Regular.woff2`.
3. Set `source.archive` to a complete HTTP(S) download URL, preferably a pinned
   official release including its license. Existing hosted archives can also
   be linked by their complete URLs. Tiparo does not upload or manage archives.
4. Keep a copy of the upstream copyright and license notice in
   `public/licenses/<font-id>.txt` so it accompanies the deployed preview files.
   Record the notice in the [license documentation](../about/license.md).

Copy the listed preview files into the tracked font directory, then start the
app (which regenerates the manifest):

```bash
aube run fonts:sync -- <font-id>
aube run dev
```

Check the default face, all styles on the detail page, metadata, and download
link. Commit the family spec, preview assets, `src/data/generated-font-library.ts`,
and `src/data/generated-fonts.css`.

For later metadata-only edits, run `aube run content:sync`. For changed preview
files, run `fonts:sync` first. Sync replaces the tracked family directory with
the spec and listed assets, so keep other upstream material in `content/upstreams/`.
