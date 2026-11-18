---
icon: lucide/type
---

# Architecture

Tiparo is a static React, TypeScript, and Tailwind app built with Vite. GitHub
Pages serves the app and these Zensical docs. There is no backend or database.

## Content flow

Each family has a `content/fonts/<font-id>/family.json` and tracked preview
fonts, preferably WOFF2. Full upstream material, including licenses and source
files, stays in the git-ignored `content/upstreams/<font-id>/` directory.

### Site previews

![Upstream files and family metadata become preview assets, generated font data and CSS, then the static site.](../static/diagrams/content-flow.svg)

[Diagram source](../diagrams/content-flow.mmd).

`fonts:sync` copies only the files listed in the spec. It stages every copy
before replacing the tracked directory, preserving `family.json` and removing
stale assets on success.

`content:sync` reads JSON, validates preview paths, and generates typed metadata
in `src/data/generated-font-library.ts` and font rules in
`src/data/generated-fonts.css`. Vite resolves the CSS asset URLs when building.
Edit the JSON, not the generated files. `dev` and `build` regenerate both outputs
automatically; rerun `content:sync` after changing metadata while the dev server
is running.

### Font downloads

![Each family's download URL points to an upstream release or an existing hosted archive, separate from site assets.](../static/diagrams/font-downloads.svg)

[Diagram source](../diagrams/font-downloads.mmd).

`source.archive` contains the complete download URL for an official release or
an existing hosted archive. Downloads are neither bundled with the site nor
uploaded by its build. See [adding fonts](adding-fonts.md) for the workflow.

The diagrams are static SVGs rendered with [Pele](https://pele.run/) during the
docs build. They need no browser JavaScript. Dashed arrows show references.

## App structure

`src/main.tsx` mounts the app and imports the generated font CSS. `src/App.tsx`
handles search, list/grid views, shared preview text, and hash routing: `#/` for
the library and `#/fonts/<font-id>` for a family. Hash routes work on Pages
without server rules; parsing lives in `src/lib/routes.ts`.

| File | Responsibility |
| --- | --- |
| `src/components/font-card.tsx`, `font-list-row.tsx` | Library previews |
| `src/components/font-detail-page.tsx` | Metadata, paragraph samples, all styles, and download link |
| `src/components/editable-specimen-text.tsx` | Editable samples; resizes after text, layout, and font-loading changes |
| `src/lib/specimen.ts` | Applies per-font character rules and preview sizing |
| `src/data/fonts.ts` | Runtime data types |
| `scripts/lib/font-spec.mjs` | Shared JSON validation and path handling |

The generated CSS defines a unique family name per face, such as
`tiparo-inter-0`. All rules are registered at startup, and the browser fetches
font files as they are used. The default face is resolved during generation
from `display.style`, falling back to regular 400 or the first face.

## Maintenance

- [Local setup and commands](../about/installation.md)
- [Font metadata reference](../reference/family-json.md)
- [Checks before committing](../about/contributing.md)
- [Deployment and domains](deployment.md)
