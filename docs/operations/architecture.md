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
Additional upstream font notices are preserved in `public/licenses/`; see
[font licenses](../about/license.md) for the registered releases and notices.

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
handles search, the library list, shared preview text, and hash routing: `#/` for
the library and `#/fonts/<font-id>` for a family. Hash routes work on Pages
without server rules; parsing lives in `src/lib/routes.ts`. The family route
lazily imports `FontDetailPage` behind a `Suspense` fallback, keeping the
gallery, scene data and canvas code out of the library view’s initial download.

| File | Responsibility |
| --- | --- |
| `src/index.css` | Shared interface typography, colours, surfaces, spacing, and responsive layout tokens |
| `src/lib/layout.ts` | Shared page-shell class references; layout rules live in `index.css` |
| `src/lib/use-scroll-reveal.ts` | One-time font-page entrances, viewport observation, and motion-preference handling |
| `src/components/app-header.tsx` | Compact font-page header, home/back navigation, and action slot |
| `src/components/font-summary.tsx` | Consistent family name, credits, and style count in library rows |
| `src/components/font-list-row.tsx` | Editable library previews and navigation to font details |
| `src/components/font-detail-page.tsx` | Editable paragraph samples, mockup canvas, metadata, and download link |
| `src/components/font-mockup-gallery.tsx`, `font-mockup.css` | Live typography over sourced mockup images in a repeating canvas |
| `public/mockups/local/` | Locally served WebP backgrounds and print-surface masks for 40 scenes from 32 supplied archives |
| `public/licenses/lucide.txt` | Complete ISC and Feather-derived MIT notices for Lucide interface icons |
| `src/components/editable-specimen-text.tsx` | Editable samples; resizes after text, layout, and font-loading changes |
| `src/lib/specimen.ts` | Applies per-font character rules and preview sizing |
| `src/lib/mockup.ts` | Selects real headline/body faces and sanitizes mockup copy |
| `src/data/mockup-scenes.ts` | Image credits, quotation sources and surface assignments for the supplied mockups |
| `src/data/agitprop-sources.ts` | Author, work, year and source URL for each quoted text |
| `src/data/agitprop-designs.ts` | 57 quotation panels, line sizes, shared print palette and related panel sequences |
| `src/components/mockup-print.tsx` | Live typographic artwork, source colophons and font fitting |
| `src/data/generated-mockup-assets.json` | Exported image dimensions, print-surface corners, proportions and alpha-mask paths |
| `scripts/build-mockup-assets.py` | Rebuilds the web exports from local `content/mockups/` archives |
| `src/lib/mockup-projection.ts` | Maps live typography to photographed paper, screens, canvases and walls |
| `src/lib/mockup-warp.ts` | Samples bicubic envelopes and tessellates curved surfaces into live-HTML pieces |
| `tests/test_mockup_warp_export.py` | Checks warp extraction against cached PSD descriptors and raster bounds |
| `src/components/ui/infinite-canvas.tsx` | Repeating viewport, pan/zoom, reset, and keyboard navigation using react-zoom-pan-pinch |
| `src/lib/repeating-canvas.ts` | Enumerates only visible periodic scene copies, including negative coordinates |
| `src/lib/mockup-layout.ts` | Justified rows preserve crop proportions and spacing at repeat boundaries |
| `src/lib/mockup-render-quality.ts` | Zoom bands, device-pixel-aware print resolution and curved-surface detail |
| `src/data/fonts.ts` | Runtime data types |
| `scripts/lib/font-spec.mjs` | Shared JSON validation and path handling |

The interface uses Geist with a shared hierarchy: bold 32–48px page titles,
18px family names, 14px body and control text, and 12px metadata. Mobile inputs
use 16px text to avoid browser zoom. Editable specimens and mockups
retain the selected font's actual faces and their independent type sizes.

`AppHeader` provides the compact sticky header on font pages, with the logo at
the top left and download controls opposite. The library opens with a centered
logo hero in normal document flow and search below it. The existing SVG scales
from 128–208px wide, with 40–80px above it and 24–40px between the logo and search
and below the search. The hero adds no visible heading, tagline or divider.

`FontSummary` keeps family metadata consistent. Page shells share responsive
gutters, and section stacks use the same spacing scale. The library is list-only:
horizontal rules separate flat rows, with no
view switch or surrounding card frame. The grid card and its dedicated specimen
sizing function have been removed.

Library rows provide their own outer spacing, without additional body padding:
24–32px above and below each row, with 16–20px between its metadata and specimen.
The empty search state and font detail pages retain their separate body spacing.

Controls are 40px high and outlined. Controls, canvas surfaces and mockup frames
have square corners. The shared `--ui-rule-width: 2px` token gives headers,
list rows, specimens, metadata, canvas frames and controls consistently bold
neutral rules; it also applies to documentation navigation and content frames.
Canvas focus leaves its border unchanged. Solid backgrounds, flat surfaces and
bold rules give the interface its minimal brutalist structure. Common tokens
use Flexoki neutrals for backgrounds,
text, borders and muted text, with Tiparo's yellow reserved for highlights.
Specimen text uses the shared foreground token. The freeform specimen layout
still adapts into columns on larger screens, and the mockup canvas keeps its
repeating justified rows.

Motion uses CSS and native viewport observation without an additional dependency.
The home logo fades in over 600ms, settling upward by 16px and growing from 96%
to full size.
The search field follows after 100ms with a 420ms fade and an 8px upward settle;
library content fades in over 480ms after a 180ms delay.

On font pages, `useScrollReveal` observes the title, individual specimens, gallery
and metadata rows once per family visit. Entrances begin as each target enters
the viewport, using a zero intersection threshold so tall specimens also reveal.
The title, specimens and metadata rise 20px while fading in over 650ms.
Specimens have 90/180/270ms delays; metadata rows stagger by 55ms, capped at 220ms.
The gallery wrapper fades in over 700ms without moving, and the detail body has
no additional fade. Repeated mockups and projected print surfaces remain steady.
Revealed targets stop being observed; editing does not replay their entrances.

Content is visible by default and remains so without `IntersectionObserver` or
when reduced motion is requested. Focus or pointer interaction immediately
finishes a target's reveal. Enabling reduced motion exposes all pending content
and cancels active entrances; changing families cleans up observers and listeners.
The canvas reads its motion preference before its first render.
Buttons, links, row titles and input borders use 180ms colour feedback, with small
button lifts and presses, back-logo rotation, link-icon movement and family-title
shifts on hover. These decorative effects also respect reduced motion. Focus
outlines and filtering remain immediate.

The generated CSS defines a unique family name per face, such as
`tiparo-inter-0`. All rules are registered at startup, and the browser fetches
font files as they are used. The default face is resolved during generation
from `display.style`, falling back to regular 400 or the first face.

Font pages show editable freeform specimens first, followed by a repeating canvas
of 40 street, flyer and book mockups and type information. The supplied mockups are shuffled when
the gallery mounts, then stay stable while editing specimens or exploring the
canvas.
Sections use accessible labels without visible section headings; the font family
title, metadata field labels, and canvas controls remain visible. The page heading
shows the family name alone; optional specimen notes remain in the registry.
The freeform samples remain expanded. The canvas has a plain, solid background,
and mockup cards show only the images and their projected typography.
The tiled-gallery approach was informed by
[useLayouts Infinite Grid](https://uselayouts.com/docs/components/infinite-grid),
with [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch)
providing drag, pinch, keyboard navigation, and zoom. Justified rows form a
period that repeats horizontally and vertically. Only copies intersecting the
viewport and a 240-pixel buffer are mounted, so travelling farther does not grow
the DOM. Repeated images reuse the same local URLs and browser cache.

The compact viewer uses `clamp(24rem, 58svh, 44rem)` for its height, changing to
`clamp(20rem, 52svh, 32rem)` below 640px. It opens and resets at exactly 50% zoom
on every screen, with a zoom range of 20–400%. The first mockup starts 16px from
the left and 24px from the top; wide mockups can extend beyond narrow viewports
and remain accessible by panning.

The canvas supports double-click inspection and a reset button, and leaves
ordinary wheel scrolling to the page. Keyboard controls are scoped to the
focused viewport; reduced motion disables animation and inertia.
The canvas region includes keyboard instructions for assistive technology;
repeated visual copies are hidden from it.

The canvas uses the layered mockups supplied in `content/mockups/`, covering
posters, banners, billboards, lightboxes, stickers, an advertising column, a stand,
a three-frame display, flyers and a sewn book. `aube run mockups:build` exports
blank photographs and
per-surface alpha masks to `public/mockups/local/`, plus projection metadata to
`src/data/generated-mockup-assets.json`. Normal app builds use the checked-in
exports and do not need the source ZIPs or Python. For metadata-only updates,
`uv run scripts/build-mockup-assets.py --metadata-only MDU049 MDU088` retains the
existing photographs and masks while refreshing placement and warp controls.

Each scene has a `pages` array, including every visible print surface. Four
corners from each PSD smart object define its perspective transform. Four of
the 57 surfaces also have bicubic control grids: both cylinder surfaces in
`mdu049` and the custom envelopes in `mdu088` and the right book page of
`md1263-4`. Cylinder parameters are converted
at export time, with hidden back regions excluded. Controls are normalized to
Photoshop's control-point hull, preserving the original print proportions.

`src/lib/mockup-warp.ts` samples each envelope and adaptively tessellates it into
clipped live-HTML pieces, each placed by a CSS perspective transform. A fitted
composition supplies those pieces, so the typography remains live rather than
becoming a raster image. Raster transparency and ancestor masks clip torn edges
and foreground objects. Photograph, masks and lettering scale together during
resize and zoom. The mesh follows the exported bicubic deformation; arbitrary
Photoshop pixel-displacement filters and fine wrinkle displacement remain
unmodeled, while photographed shading and texture are retained.

Rendering detail follows the camera in 25/50/100/200/400% bands, with a small
downgrade hysteresis to avoid repeated rebuilding near a boundary. Device pixel
ratio and each print's projected scale select a 1×, 2× or 4× source plane. The
destination corners and paper masks stay fixed. Curved surfaces target 0.35
device-pixel approximation error, within bounded tolerance limits; overview
views use fewer patches and close views gain detail. Panning within a band keeps
the existing print DOM. Screen-density changes refresh the selected detail.

All print fitting happens on the original 600px-wide plane. Rendered copies
inherit its fit factors, use ordinary wrapping and retain a 0.5% fitting margin
for scaled font-metric rounding. Automatic optical sizing is disabled so zoom
does not select a different font design. One masked blue sheet underlies each
composition, preventing gaps between curve patches from exposing the unprinted
photograph. Photographs and alpha masks retain their original export resolution;
fine credits become readable by zooming closer, rather than changing the artwork.

The selected font's real faces remain live: display cuts for broadsides and
placards, and text cuts for paragraph statements and credits. Text fits again
after font loading; limited character sets follow their specimen rules while
preserving line breaks. Landscape surfaces keep authored banner line breaks,
and small panoramic strips retain the quotation and author credit.
All panels use blue stock (`#1F5EA6`) and white text (`#ffffff`), including accents
and credits, multiplied over the photographed surface to preserve its lighting
and texture. Four typographic treatments vary line sizes, paragraph setting and
placement according to the text. A small source colophon replaces decorative
stamps and emblems. Headline width fitting is separate from supporting copy; a
second pass fits the composition to the underlying print plane. Folds, tears,
foliage and frames may naturally cover lettering without triggering automatic
layout avoidance. Side margins still account for curved columns and printed-area
proportions. The source templates' sample artwork is excluded from the exports.

The canvas eagerly loads nearby copies' shared local images because WebKit can
miss native lazy-loading triggers on transformed photo layers. Image credits,
archive filenames and specimen source URLs remain in the scene data and
[asset documentation](mockup-assets.md). Licensed source archives stay local and
are excluded from Git and the app's public assets.

Print compositions contain no decorative icons. The earlier Phosphor artwork
and its licence are retained in the repository but are not rendered. Lucide
remains in use for interface controls; its complete ISC and applicable Feather
MIT notices are retained in `public/licenses/lucide.txt`.

Short quotations follow the primary texts, archived editions or publisher
excerpts recorded in `agitprop-sources.ts`. Each panel retains its own author,
work, year and URL; the rendered `blockquote` carries the source in `cite`.
A work-title specimen is marked separately. Capitals and line breaks can change
for a composition while quoted wording stays intact. See the
[mockup assets](mockup-assets.md#text-sources) for the complete source list.

## Maintenance

- [Local setup and commands](../about/installation.md)
- [Font metadata reference](../reference/family-json.md)
- [Checks before committing](../about/contributing.md)
- [Deployment and domains](deployment.md)
