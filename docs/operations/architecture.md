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
| `public/mockups/` | Locally served WebP images for 75 print, device and art scenes |
| `src/components/mockup-icon.tsx` | Renders Phosphor print icons with their original viewBox and square dimensions |
| `src/data/mockup-icons.ts` | Fourteen unmodified filled SVG paths from `@phosphor-icons/core` 2.1.1 |
| `public/licenses/phosphor.txt` | Original MIT copyright and permission notice for the Phosphor artwork |
| `public/licenses/lucide.txt` | Complete ISC and Feather-derived MIT notices for Lucide interface icons |
| `src/components/editable-specimen-text.tsx` | Editable samples; resizes after text, layout, and font-loading changes |
| `src/lib/specimen.ts` | Applies per-font character rules and preview sizing |
| `src/lib/mockup.ts` | Selects real headline/body faces and sanitizes mockup copy |
| `src/data/mockup-scenes.ts` | Text/image credits, crops, print-surface corners, optional second pages, icon choices, designs, and urban/art setting tags |
| `src/lib/mockup-projection.ts` | Maps live typography to photographed paper, screens, canvases and walls |
| `src/components/ui/infinite-canvas.tsx` | Repeating viewport, pan/zoom, reset, and keyboard navigation using react-zoom-pan-pinch |
| `src/lib/repeating-canvas.ts` | Enumerates only visible periodic scene copies, including negative coordinates |
| `src/lib/mockup-layout.ts` | Justified rows preserve crop proportions and spacing at repeat boundaries |
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
of 75 distinct print, device and art mockups and type information.
The 21 scenes marked `setting: "urban"` or `setting: "art"` come first as a
combined group: 16 urban scenes plus five art scenes. This group
and the remaining 54 scenes are independently shuffled
when the gallery mounts, then stay stable while editing specimens or exploring
the canvas.
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
on every screen, with a zoom range of 20–250%. The first mockup starts 16px from
the left and 24px from the top; wide mockups can extend beyond narrow viewports
and remain accessible by panning.

The canvas supports double-click inspection and a reset button, and leaves
ordinary wheel scrolling to the page. Keyboard controls are scoped to the
focused viewport; reduced motion disables animation and inertia.
The canvas region includes keyboard instructions for assistive technology;
repeated visual copies are hidden from it.

The scenes include books, open publications, notebooks, posters, placards,
framed prints, working papers, reading cards, paired wall posters, a freestanding
banner, postal envelopes, correspondence cards and clipped prints.
Eight device reading scenes include four phones, two laptops, a desktop monitor
and a tablet. The urban photographs include a night street lightbox, an airport
digital display, a concrete facade billboard, a terminal lightbox and an
industrial wall poster. The metro group adds a cinema, a drive-in screen and
a sunlit street lightbox.
Five art scenes add a handheld magazine, a spiral sketchbook on black timber,
a gallery wall and two studio canvases.
The selection favours neutral paper and textiles, natural city light and clear
type surfaces. A red pocket pamphlet and blue physical billboard retain their
original photographed colours. Dark cloth, kraft covers, cream paper,
newsprint, street lightboxes and illuminated panels provide varied materials
and lighting. Each
uses the selected font’s real faces, preferring Display cuts for headlines and
text cuts for body copy.
Four measured image corners define each print surface’s CSS
perspective transform. A tight crop translates and scales the full image and
projected typography together, keeping the lettering on its photographed surface as
the frame resizes or zooms. An optional second page has its own surface and text
layout, so open publications can show running prose or chapter contents beside
a title.

Eight device scenes use `composition: "screen"` to show a digital publication in the
selected font, including its navigation label, author credit, article heading,
body copy and footer. Portrait screens stack the heading and body; wide laptop
and desktop screens place them in two columns. Decorative Lucide book and
search icons sit in the navigation bar. Measured screen surfaces avoid bezels,
notches, rounded corners and home indicators, and the transparent text overlay
retains the photograph’s screen lighting. The street and terminal lightboxes
use poster layouts. Seven scenes—the airport display, digital billboard,
concrete billboard, industrial wall poster, cinema screen, drive-in screen and gallery wall—use
`composition: "billboard"`, reducing author credits, supporting copy, footers
and spacing to make the headline dominant on landscape surfaces.
The eight `device-*`, five `urban-*` and three `metro-*` photographs use WebP
quality 82, method 6, with a maximum longest side of 1,800 pixels. Urban crops
preserve natural light, concrete, metal and surrounding structures while keeping
the measured display surfaces prominent. Metro crops retain cinema lighting,
drive-in corrugation and sunlight around the type. Surface
insets avoid hands, notches and rounded frames; ordinary print padding keeps
cinema lettering inside slightly curved screen edges.

Four art scenes use `composition: "exhibition"`, placing a small author credit
above large left-aligned type and a year at the lower right. The magazine’s
second page has its own projection and a short Benjamin excerpt, inset above
the reader’s forearm. The sketchbook print avoids binding and shadows, the
canvas prints avoid easel clamps and edges, and the gallery wall’s billboard
layout stays clear of the room corner and fixtures. All five `arts-*` images
retain their natural light and texture, with neutral dark ink, no external
taglines, and WebP quality 82, method 6, at up to 1,800 pixels on the longest side.

The backgrounds comprise 70 photographs and five existing 3D mockup renders
from Pexels, Unsplash and Pixabay. No AI-generated backgrounds are used. The
local WebP assets total 8,225,378 bytes (about 7.84 MiB). The canvas mounts nearby
copies and eagerly loads their shared local images because WebKit can
miss native lazy-loading triggers on the transformed photo layers. Creator
credits and source URLs remain in the scene data and documentation rather
than appearing beneath the images.
See [mockup assets and licences](mockup-assets.md) for all image and text sources.
Typography fits its print surface after resizes and font loading.
Headlines keep whole words and shrink when needed. Mockup ink uses Flexoki
neutrals: `#100f0f` by default and `#fffcf0` on dark surfaces. Source
photographs keep their natural colours.
Character restrictions apply to all mockup
text while preserving line breaks.

Twenty-eight print scenes include one of fourteen filled icons from
[Phosphor Icons](https://github.com/phosphor-icons/core). The original SVG path
strings from `@phosphor-icons/core` 2.1.1 are stored in `mockup-icons.ts` and
rendered by `mockup-icon.tsx`. Their geometry and `0 0 256 256` viewBox are kept
intact; no runtime icon package is needed. The original MIT notice is retained
in `public/licenses/phosphor.txt`.

Each SVG inherits the print’s ink and shares its perspective, crop, fit factor
and canvas zoom. Explicit equal width and height preserve square proportions:
28cqw above or below the copy, 26cqw beside it, and 34cqw above or below the copy
in art prints. These dimensions and spacing scale with `--mockup-fit`. The
icons are decorative (`aria-hidden`, non-focusable), leaving the text to convey
the meaning. Lucide remains in use for interface controls; its complete ISC
and applicable Feather MIT notices are retained in `public/licenses/lucide.txt`.

Mockup copy combines Marxist, socialist feminist and Black feminist writing
with art criticism. Feminist treatments cover women’s labour, suffrage, peace,
social reproduction, collective organising and visual culture, using short
excerpts and work titles across print and screen contexts. Authors include
Kollontai, Zetkin, Luxemburg, Eleanor Marx, Federici, Davis, Jones, James,
Arruzza, Bhattacharya, Fraser, Dalla Costa, Vogel, Mies, Ferguson and bell hooks,
alongside the Combahee River Collective. Collective authorship, editor credits
and bell hooks’s lowercase name are preserved on the objects. Existing works
remain represented as repeated-copy scenes take on additional texts.
The matted and exhibition prints pair the art icon with bell hooks’s
*Art on My Mind* and Davis’s *Women, Culture & Politics*. The digital billboard
pairs the resistance icon with the Combahee River Collective’s statement.
The metro scenes pair short excerpts with their settings: Marx’s eighth thesis
in a cinema, the Manifesto’s passage on free development in a street lightbox,
and Morris’s *Art and Labour* on a drive-in screen.
The art scenes use Benjamin’s *The Author as Producer* and *The Work of Art*,
Berger’s *Ways of Seeing*, and existing Morris passages. Benjamin’s 1934 text
is distinguished from its linked 1970 translation; Berger’s title, brief
opening and 1972 date follow Penguin’s publication record.
Links to primary texts, archival records and publisher excerpts remain in the
scene data, including the Marxists Internet Archive, William Morris Archive,
Penguin, Verso, PM Press, Pluto, Haymarket, Bloomsbury and The New Press. Source
notes distinguish original publication or speech dates from later translations
and editions, and identify marked excerpts. Publisher descriptions and endorsements
are not used as quotations by the authors.
They are recorded with the [mockup assets](mockup-assets.md#text-sources).

## Maintenance

- [Local setup and commands](../about/installation.md)
- [Font metadata reference](../reference/family-json.md)
- [Checks before committing](../about/contributing.md)
- [Deployment and domains](deployment.md)
