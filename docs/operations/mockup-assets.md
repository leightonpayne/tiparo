# Mockup images and text sources

The text-preview canvas uses 40 scenes from the 32 Mockups Design archives supplied in
`content/mockups/`: street posters, stickers, lightboxes, billboards, banners,
a cardboard stand, an advertising column, a three-frame display, flyers and a
sewn book. The three flyer/book packs contribute all 11 of their photographed angles.
The layered Photoshop files stay local. The application serves generated WebP
backgrounds and alpha masks from `public/mockups/local/`, with live lettering in
the selected font. The source archives' blue demonstration artwork is removed.

## Rebuilding the assets

```bash
aube run mockups:build
```

This runs `scripts/build-mockup-assets.py` with its pinned Python dependencies
through `uv`. It reads the ZIP archives directly and writes the web images and
`src/data/generated-mockup-assets.json`. Ordinary development and production
builds use these checked-in exports; they do not require Python or the archives.
Each PSD in a multi-scene archive gets a separate scene; numbered filename suffixes
keep its ID stable (`md1034-1`, for example). The manifest records the source
archive and the document path within it. To rebuild just the added packs:

```bash
aube run mockups:build MD1034 MD1145 MD1263
```

To refresh only placement and warp metadata while retaining existing photographs
and masks:

```bash
uv run scripts/build-mockup-assets.py --metadata-only MDU049 MDU088
```

Omit the archive prefixes to update the whole collection. Exporter regression
checks use small cached descriptor fixtures rather than opening the source PSDs:

```bash
uv run tests/test_mockup_warp_export.py
```

The exporter hides the visible artwork smart objects and flattened preview
layers, retaining the photography, paper texture, shadows and highlights. It
reads the smart objects' perspective corners and print proportions, and combines
raster transparency with the enclosing layer masks. Each printed surface gets
its own full-image alpha mask, so torn edges, frames, foliage and other foreground
objects clip the printed designs. Paired and three-panel surfaces use related
excerpts from the same work or movement.

`MDU056` uses its enclosing paper mask for full bleed: the embedded sample
artwork has transparent margins that are not part of the physical sheet outline.
The export fills the complete paper while preserving its torn edge.

Fifty-three surfaces need only their four-corner perspective transform. Four also
carry bicubic warp controls: the main sheet and top strip of `mdu049`, and the
custom envelopes on `mdu088` and the right page of `md1263-4`. The exporter reads
the custom control points or converts the column's cylinder parameters into a mesh, normalizing against the
control-point hull used by Photoshop. Cylinder domains exclude the hidden back
of the sheet, and the print keeps its original source proportions.

At runtime, adaptive tessellation maps clipped pieces of the same live HTML
composition onto the curved surface. Text remains live and uses the chosen font;
it is not baked into a bitmap. Existing alpha masks still clip foreground
objects and torn edges. This models the exported bicubic envelopes, not arbitrary
Photoshop pixel-displacement filters. Fine wrinkles retain photographed lighting
and texture without claiming exact displacement of every glyph.

Preview quality adapts to the canvas zoom and screen pixel density. Small views
use fewer curve patches; closer views increase patch detail and render the live
type on 1×, 2× or 4× source planes. The same canonical layout supplies every
resolution, with stable line breaks and unchanged paper geometry. A continuous
masked blue background prevents patch seams. The viewer supports 20–400% zoom;
the photo and mask exports themselves remain at their supplied web resolution.

## Image source and licence

All 32 archives are from [Mockups Design](https://mockups-design.com/). The
supplied `MDP063_Free_Street_Poster_Mockup.zip` contains `MD_Licence.pdf`.
That notice permits commercial and private use of modified, flattened images;
it prohibits redistribution of the source templates as PSD or another editable
format. The original licence accompanies the exports in
`public/licenses/mockups-design.pdf`.
The newer notice supplied with `MD1145` and `MD1263` accompanies those exports in
`public/licenses/mockups-design-current.pdf`; it likewise allows flattened images
and prohibits redistributing editable source templates.
The mockups retain their own licence independently of the application's MIT
licence. ZIPs and extracted PSDs are not served by the app; the source ZIPs are
ignored by Git. No AI-generated imagery is used.

| Web image | Local source archive |
| --- | --- |
| `local/md1034-1.webp` … `local/md1034-3.webp` | `MD1034_8,5x14in_Flyer_Mockup.zip` |
| `local/md1145-1.webp` … `local/md1145-4.webp` | `MD1145_DL_Flyer_Mockup.zip` |
| `local/md1263-1.webp` … `local/md1263-4.webp` | `MD1263_Sewed_Book_Mockup.zip` |
| `local/mdp063.webp` | `MDP063_Free_Street_Poster_Mockup.zip` |
| `local/mds339.webp` | `MDS339_Free_Billboard_Mockup.zip` |
| `local/mdu025.webp` | `MDU025_Posters_Mockup.zip` |
| `local/mdu033.webp` | `MDU033_Fence_Banner_Mockup.zip` |
| `local/mdu044.webp` | `MDU044_Torn_Poster_Mockup.zip` |
| `local/mdu047.webp` | `MDU047_Street_Sticker_Mockup_4.zip` |
| `local/mdu049.webp` | `MDU049_Advertising_Column_Mockup.zip` |
| `local/mdu055.webp` | `MDU055_Two_Citilights_Mockup.zip` |
| `local/mdu056.webp` | `MDU056_Urban_Poster_Mockup.zip` |
| `local/mdu059.webp` | `MDU059_Wrinkled_Urban_Poster_Mockup.zip` |
| `local/mdu062.webp` | `MDU062_Banners_On_Metal_Construction_Mockup.zip` |
| `local/mdu064.webp` | `MDU064_Two_Torned_Posters_Mockup.zip` |
| `local/mdu067.webp` | `MDU067_Citylight_Poster_Mockup.zip` |
| `local/mdu068.webp` | `MDU068_Big_City_Banner_Mockup.zip` |
| `local/mdu069.webp` | `MDU069_Billboard_Mockup.zip` |
| `local/mdu070.webp` | `MDU070_Cardboard_Stand_Mockup.zip` |
| `local/mdu071.webp` | `MDU071_Sign_Mockup.zip` |
| `local/mdu075.webp` | `MDU075_Bus_Station_Poster_Mockup.zip` |
| `local/mdu076.webp` | `MDU076_Street_Sticker_Mockup_5.zip` |
| `local/mdu077.webp` | `MDU077_Billboard_Mockup.zip` |
| `local/mdu078.webp` | `MDU078_Hanging_Construction_Banner.zip` |
| `local/mdu079.webp` | `MDU079_Rough_Banner_Mockup.zip` |
| `local/mdu081.webp` | `MDU081_Bus_Station_Poster_Mockup.zip` |
| `local/mdu084.webp` | `MDU084_Citylight_Poster_Mockup.zip` |
| `local/mdu085.webp` | `MDU085_Old_Billboard_Mockup.zip` |
| `local/mdu086.webp` | `MDU086_Large_Banner_Street_Mockup.zip` |
| `local/mdu088.webp` | `MDU088_Poster_With_A_Fly_Mockup.zip` |
| `local/mdu089.webp` | `MDU089_Bus_Stop_Citylight_Mockup.zip` |
| `local/mdu090.webp` | `MDU090_Three_Poster_Frames_Mockup.zip` |

## Live typography

`src/data/agitprop-designs.ts` supplies 57 distinct quotation panels,
paired with the 40 exported scenes by `src/data/mockup-scenes.ts`. Each printed
surface has its own passage, including alternate angles and stacked copies in
the flyer and book packs. Broadsides use
explicit line sizes; longer statements use paragraph typography; placards centre
short texts; contrasting clauses receive comparable visual weight. Line breaks,
placement, margins and headline/body proportions are chosen for each passage and
surface. All panels share blue stock (`#1F5EA6`) and white text (`#ffffff`),
including accents and credits.

Credits form a small colophon beneath the quotation.
The print designs contain no icons, date stamps, stripes or ornamental shapes.
Their wrinkles, torn edges and texture come from the supplied photographs.
The artwork remains live HTML/CSS, not lettering baked into an image.

Broadsides and placards use the selected family's real display faces; paragraph
statements and credits use its text face. All lettering follows the family's
character restrictions. Long lines fit independently of supporting copy. A second
fitting pass finds the largest size that fits the underlying print plane after
fonts load, including wide banners and narrow strips with author credits.
Natural folds, tears, foliage and frames may cover lettering; the layout does
not automatically avoid these occlusions. Side margins can still account for
curved columns and printed-area proportions.

White ink and the common blue stock multiply over the blank photographed paper,
retaining its texture and lighting. Photograph, masks and artwork scale together
as the canvas is resized, panned or zoomed. All assets remain local.

Lucide remains in use for interface controls; its ISC and Feather MIT notices
remain in `public/licenses/lucide.txt`. The earlier Phosphor artwork and its MIT
notice remain in the repository but are not used in these print compositions.

## Text sources

The posters use short, verified excerpts from primary texts, archived editions
and publisher excerpts. The author, year and work title appear in a colophon below
the quotation; narrow strips retain the author and year. `No Master`
is a work-title design, marked separately from excerpts in the data.
Capitalisation, line breaks and typographic punctuation are adapted to the
layouts. The wording follows the linked edition, including its translation;
fragments are excerpts rather than claims to reproduce whole sentences.
The year identifies the writing, delivery or first publication of the work,
not necessarily the date of the linked edition.

`src/data/agitprop-sources.ts` records author, work, year and URL. Each panel in
`src/data/agitprop-designs.ts` points to its own source, and the rendered
`blockquote` carries that URL in its `cite` attribute. Historical quotations
are composed as contemporary type specimens, rather than reproductions of
historical posters. Paired mockups can combine passages from different works;
the source is credited on each panel. Panel numbers below follow PSD layer order,
which does not necessarily match left-to-right order in the photograph.

| Scene / panels | Author | Work | Year |
| --- | --- | --- | --- |
| `md1034-1` / 1 | Frederick Douglass | [West India Emancipation](https://home.nps.gov/frdo/learn/historyculture/thoughts-for-all-time.htm) | 1857 |
| `md1034-2` / 1 | Eugene V. Debs | [Social Reform / Labor & Freedom](https://www.marxists.org/archive/debs/works/1916/1916-socreform.htm) | 1916 |
| `md1034-3` / 1 | Industrial Workers of the World | [Preamble to the IWW Constitution](https://archive.iww.org/about/official/StJohn/2/) | 1905 |
| `md1034-3` / 2 | Lucy Parsons | [Speech to the IWW](https://www.lucyparsonsproject.com/writings/speech_to_iww.html) | 1905 |
| `md1145-1` / 1 | Mary Wollstonecraft | [A Vindication of the Rights of Woman / IV](https://www.marxists.org/reference/archive/wollstonecraft-mary/1792/vindication-rights-woman/ch04.htm) | 1792 |
| `md1145-2` / 1 | Emma Goldman | [The Tragedy of Woman’s Emancipation](https://www.marxists.org/reference/archive/goldman/works/1906/tragedy-women.htm) | 1906 |
| `md1145-3` / 1 | Clara Zetkin | [Only in Conjunction With the Proletarian Woman Will Socialism Be Victorious](https://www.marxists.org/archive/zetkin/1896/10/women.htm) | 1896 |
| `md1145-4` / 1 | Sylvia Pankhurst | [Communism and its Tactics / Part Seven](https://www.marxists.org/archive/pankhurst-sylvia/communism-tactics/ch07.htm) | 1922 |
| `md1145-4` / 2 | Voltairine de Cleyre | [Direct Action](https://theanarchistlibrary.org/library/voltairine-de-cleyre-direct-action) | 1912 |
| `md1263-1` / 1 | Oscar Wilde | [The Soul of Man under Socialism](https://www.marxists.org/reference/archive/wilde-oscar/soul-man/) | 1891 |
| `md1263-2` / 1 | W. E. B. Du Bois | [The Souls of Black Folk / Of Our Spiritual Strivings](https://teachingamericanhistory.org/document/the-souls-of-black-folk-2/) | 1903 |
| `md1263-2` / 2 | Peter Kropotkin | [The Conquest of Bread / II](https://www.marxists.org/reference/archive/kropotkin-peter/1892/bread.htm) | 1892 |
| `md1263-3` / 1 | William Morris | [A Dream of John Ball / IV](https://www.marxists.org/archive/morris/works/1886/johnball/johnball.htm) | 1886–1887 |
| `md1263-4` / 1 | Anna Julia Cooper | [A Voice from the South / Woman versus the Indian](https://nclhof.org/inductees/2024-2/anna-julia-cooper/) | 1892 |
| `md1263-4` / 2 | Ida B. Wells | [Southern Horrors / Self-Help](https://www.gutenberg.org/cache/epub/14975/pg14975.txt) | 1892 |
| `mdp063` / 1 | Karl Marx | [Instructions for the Delegates of the Provisional General Council](https://www.marxists.org/archive/marx/works/1866/08/instructions.htm) | 1866 |
| `mdp063` / 2 | Karl Marx | [Value, Price and Profit](https://www.marxists.org/archive/marx/works/1865/value-price-profit/ch03.htm) | 1865 |
| `mds339` / 1 | William Morris | [The Beauty of Life](https://www.marxists.org/archive/morris/works/1882/hopes/chapters/chapter3.htm) | 1880 |
| `mdu025` / 1, 2 | Rosa Luxemburg | [Reform or Revolution / Introduction](https://www.marxists.org/archive/luxemburg/1900/reform-revolution/intro.htm) | 1899 |
| `mdu025` / 3 | Rosa Luxemburg | [Reform or Revolution / Chapter VIII](https://www.marxists.org/archive/luxemburg/1900/reform-revolution/ch08.htm) | 1899 |
| `mdu033` / 1, 2, 3 | Combahee River Collective | [The Combahee River Collective Statement](https://lgbtqhistory.org/wp-content/uploads/2019/04/Combahee_River_Collective_Statement.pdf) | 1977 |
| `mdu044` / 1 | Clara Zetkin | [The Struggle Against Fascism](https://www.marxists.org/archive/zetkin/1923/06/struggle-against-fascism.html) | 1923 |
| `mdu047` / 1 | Karl Marx | [Critique of Hegel’s Philosophy of Right / Introduction](https://www.marxists.org/archive/marx/works/1844/df-jahrbucher/law-abs.htm) | 1844 |
| `mdu049` / 1, 2 | Eleanor Marx & Edward Aveling | [The Woman Question](https://www.marxists.org/archive/eleanor-marx/works/womanq.htm) | 1886 |
| `mdu055` / 1, 2 | Angela Davis | [In Conversation with Yara Shahidi](https://time.com/collections/the-new-american-revolution/5880933/angela-davis-yara-shahidi-blm-activism/) | 2020 |
| `mdu056` / 1 | bell hooks | [Feminism Is for Everybody](https://www.plutobooks.com/product/feminism-is-for-everybody/) | 2000 |
| `mdu059` / 1 | Silvia Federici | [Wages Against Housework](https://files.libcom.org/files/Federici-Silvia-Wages-Against-Housework.pdf) | 1975 |
| `mdu062` / 1, 2 | William Morris | [Useful Work versus Useless Toil](https://www.marxists.org/archive/morris/works/1884/useful.htm) | 1884 |
| `mdu064` / 1, 2 | Rosa Luxemburg | [The Socialisation of Society](https://www.marxists.org/archive/luxemburg/1918/12/20.htm) | 1918 |
| `mdu064` / 3 | Karl Marx & Friedrich Engels | [Manifesto of the Communist Party / II](https://www.marxists.org/archive/marx/works/1848/communist-manifesto/ch02.htm) | 1848 |
| `mdu067` / 1 | James Connolly | [We Only Want the Earth / Songs of Freedom](https://www.marxists.org/archive/connolly/1907/xx/wewnerth.htm) | 1907 |
| `mdu068` / 1 | Cinzia Arruzza · Tithi Bhattacharya · Nancy Fraser | [Feminism for the 99%](https://www.versobooks.com/en-gb/blogs/news/4261-feminism-for-the-99) | 2019 |
| `mdu069` / 1 | Karl Marx & Friedrich Engels | [Manifesto of the Communist Party / II](https://www.marxists.org/archive/marx/works/1848/communist-manifesto/ch02.htm) | 1848 |
| `mdu070` / 1 | Alexandra Kollontai | [Communism and the Family](https://www.marxists.org/archive/kollonta/1920/communism-family.htm) | 1920 |
| `mdu071` / 1 | William Morris | [No Master](https://morrisarchive.lib.uiowa.edu/items/show/628) | 1884 |
| `mdu075` / 1 | Friedrich Engels | [The Housing Question / Part I](https://www.marxists.org/archive/marx/works/1872/housing-question/ch01.htm) | 1872 |
| `mdu076` / 1 | Rosa Luxemburg | [The Russian Revolution / VI](https://www.marxists.org/archive/luxemburg/1918/russian-revolution/ch06.htm) | 1918 |
| `mdu077` / 1 | Karl Marx & Friedrich Engels | [Manifesto of the Communist Party / I](https://www.marxists.org/archive/marx/works/1848/communist-manifesto/ch01.htm) | 1848 |
| `mdu078` / 1, 2 | Karl Marx | [General Rules of the International Working Men’s Association](https://www.marxists.org/archive/marx/works/1871/10/24.htm) | 1871 |
| `mdu079` / 1 | William Morris | [Art and Labour](https://www.marxists.org/archive/morris/works/1884/art-lab.htm) | 1884 |
| `mdu081` / 1 | V. I. Lenin | [The State and Revolution / V](https://www.marxists.org/archive/lenin/works/1917/staterev/ch05.htm) | 1917 |
| `mdu084` / 1 | Alexandra Kollontai | [Women’s Day](https://www.marxists.org/archive/kollonta/1913/womens-day.htm) | 1913 |
| `mdu085` / 1 | William Morris | [The Lesser Arts](https://www.marxists.org/archive/morris/works/1882/hopes/chapters/chapter1.htm) | 1877 |
| `mdu086` / 1 | Rosa Luxemburg | [Women’s Suffrage and Class Struggle](https://www.marxists.org/archive/luxemburg/1912/05/12.htm) | 1912 |
| `mdu088` / 1 | James Connolly | [Socialism Made Easy](https://www.marxists.org/archive/connolly/1909/sme-la/sme2.htm) | 1909 |
| `mdu089` / 1 | Claudia Jones | [International Women’s Day and the Struggle for Peace](https://liberationschool.org/claudia-jones-1950-iwd-speech/) | 1950 |
| `mdu090` / 1, 2, 3 | Karl Marx & Friedrich Engels | [Manifesto of the Communist Party / IV](https://www.marxists.org/archive/marx/works/1848/communist-manifesto/ch04.htm) | 1848 |
