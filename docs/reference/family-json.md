---
icon: lucide/file-cog
---

# `family.json`

Each family has one `content/fonts/<font-id>/family.json`. It defines the
metadata, preview faces, download link, and optional specimen rules used by the
app. Use standard JSON, with double-quoted keys and strings and no comments or
trailing commas.

```json
{
  "details": {
    "name": "Inter",
    "designer": "Rasmus Andersson",
    "website": "https://rsms.me/inter/"
  },
  "source": {
    "archive": "https://downloads.leightonpayne.dev/tiparo/b44e318c/tiparo-inter.tar.gz"
  },
  "display": {
    "style": "Regular400"
  },
  "style": {
    "Regular400": {
      "name": "Regular 400",
      "file": "web/Inter-Regular.woff2"
    }
  }
}
```

Define at least one style. Every preview file must exist under
`content/fonts/<font-id>/` before building. After changing metadata, run
`aube run content:sync`; `dev` and `build` also do this. For new or changed font
files, follow [Adding Fonts](../operations/adding-fonts.md).

## Metadata: `details`

All values are strings unless noted.

| Key | Meaning |
| --- | --- |
| `name` | Family name; defaults to the folder's `<font-id>`. |
| `designer`, `designer_url` | One string or an array of strings each; URLs correspond to designers in the same order. |
| `foundry`, `foundry_url` | Foundry label and link. |
| `license`, `license_url` | License label and link. |
| `copyright` | Copyright text. |
| `website` | Official family link; falls back to `source.repository` when omitted. |

## Previews: `style` and `display`

Add one object per face in `style`, using stable IDs such as `Regular400` and
`Bold700Italic`.

| Style key | Meaning |
| --- | --- |
| `file` | Required file path relative to the family's directory. |
| `name` | Face label; defaults to the style ID. |

The example's `web/Inter-Regular.woff2` resolves to:

- source: `content/upstreams/inter/web/Inter-Regular.woff2`
- synced preview: `content/fonts/inter/web/Inter-Regular.woff2`

Use forward slashes and paths within the family directory. Do not include the
family ID, an `upstream/` prefix, `./`, or parent-directory segments. Prefer
individual WOFF2 face files; WOFF, TTF, and OTF are also supported.

Weight comes from the first three-digit number in the face name or style ID,
falling back to `400`. A name or ID containing `italic` marks the face italic;
the file extension determines its format.

Set `display.style` to the desired preview face's ID or name. Matching ignores
case. Without a match, generation selects the first normal face with weight
`400`, or the first face if none qualifies.

## Downloads and provenance: `source`

| Key | Meaning |
| --- | --- |
| `archive` | Complete HTTP(S) download URL. |
| `repository` | Optional upstream source link. |
| `commit` | Optional upstream revision or version marker. |

Prefer a pinned official release including the font's license. Existing hosted
archives can remain linked by their complete URLs, including the versioned
path. Omitting `archive` removes the download link. Tiparo does not manage
archive hosting or upload files.

## Optional specimen rules: `specimen`

Use these when a font cannot display ordinary preview text.

| Key | Meaning |
| --- | --- |
| `force_lowercase` | Boolean; lowercase text first. |
| `replace_punctuation` | Nonblank string replacing Unicode punctuation, for example `"*"`. |
| `supported` | String or string array listing allowed characters. Include `" "` to keep spaces. |
| `unsupported` | String or string array listing characters to remove. |
| `note` | Optional explanatory metadata retained in the registry. |

Rules run in this order: lowercase, punctuation replacement, supported-character
filter, unsupported-character filter. Empty character lists do not filter text.
