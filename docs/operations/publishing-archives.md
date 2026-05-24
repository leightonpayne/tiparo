---
icon: lucide/cloud-upload
---

# Publishing Archives

Tiparo previews and Tiparo downloads are intentionally separate. The previews
are bundled into the app and the full archives are uploaded to R2.

## What gets published

The published archive is built from:

```text
content/upstreams/<font-id>/
```

This means the download can include the complete upstream material, not just the
lightweight preview files stored in git.

## Archive URL model

The public base URL lives in:

[`content/archive-config.json`](https://github.com/leightonpayne/tiparo/blob/main/content/archive-config.json)

For relative `source.archive` values, the final public URL becomes:

```text
https://downloads.leightonpayne.dev/tiparo/<archive_version>/<archive>
```

## Publish command

```bash
bun run fonts:publish -- <font-id> --bucket <bucket-name>
```

For real uploads, Wrangler must already be authenticated locally or have
`CLOUDFLARE_API_TOKEN` set in the environment.

The publish script:

1. validates `family.toml`
2. runs `fonts:sync`
3. creates a temporary `tar.gz`
4. computes a short SHA-256 hash
5. uploads to R2 using Wrangler
6. writes the short hash back into `archive_version`
7. regenerates the runtime manifest

### Dry run mode

To inspect the result without uploading:

```bash
bun run fonts:publish -- <font-id> --dry-run
```

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

So the browser treats it as a downloadable archive, and the long cache lifetime
is safe because the URL path changes with the hash.
