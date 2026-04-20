# Publishing Archives

Tiparo previews and Tiparo downloads are intentionally separate.

- previews are bundled into the app
- full archives are uploaded to R2

## What gets published

The published archive is built from:

```text
content/upstreams/<font-id>/
```

This means the download can include the complete upstream material, not just the lightweight preview files stored in git.

## Archive URL model

The public base URL lives in:

[`content/archive-config.json`](https://github.com/leightonpayne/tiparo/blob/main/content/archive-config.json)

Current shape:

```json
{
  "baseUrl": "https://downloads.leightonpayne.dev/tiparo"
}
```

For relative `source.archive` values, the final public URL becomes:

```text
https://downloads.leightonpayne.dev/tiparo/<archive_version>/<archive>
```

Example:

```text
https://downloads.leightonpayne.dev/tiparo/abc1234/tiparo-inter.tar.gz
```

## Publish command

Run:

```bash
bun run fonts:publish -- <font-id> --bucket <bucket-name>
```

The publish script:

1. validates `family.toml`
2. runs `fonts:sync` first
3. creates a temporary `tar.gz`
4. computes a short SHA-256 hash
5. uploads to R2 using Wrangler
6. writes the short hash back into `archive_version`
7. regenerates the runtime manifest

## Dry run mode

To inspect the result without uploading:

```bash
bun run fonts:publish -- <font-id> --dry-run
```

This prints:

- temporary archive path
- computed hash
- object key
- final public URL

## Manual version control

If you need to update only the version path:

```bash
bun run archives:set-version -- <font-id> <short-hash>
```

This only edits `archive_version` in the corresponding `family.toml`.

## R2 object metadata

The publish script uploads with:

- `Content-Type: application/gzip`
- `Content-Disposition: attachment`
- `Cache-Control: public, max-age=31536000, immutable`

That is deliberate:

- the browser treats it as a downloadable archive
- the long cache lifetime is safe because the URL path changes with the hash

## Expected failure modes

- missing `source.archive`
- absolute `source.archive` when the publish script expects a relative filename
- missing local upstream directory
- missing Wrangler or bucket configuration
