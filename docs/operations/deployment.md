---
icon: lucide/workflow
---

# Deployment

Pushes to `main` trigger the [Pages workflow](https://github.com/leightonpayne/tiparo/blob/main/.github/workflows/deploy-pages.yml),
which can also be run manually. It installs locked dependencies with `aube ci`
and `uv sync --frozen --group docs`, runs tests, then builds and deploys `dist/`
to GitHub Pages.

To build the same artifact locally:

```bash
aube run pages:build
```

| Output | Public URL |
| --- | --- |
| App: `dist/` | <https://tiparo.leightonpayne.dev/> |
| Docs: `dist/docs/` | <https://tiparo.leightonpayne.dev/docs/> |

`public/CNAME` sets the custom domain. Vite uses `/` as its default base path;
set `VITE_BASE_PATH` explicitly for an app hosted under a different path. Docs
URLs are configured in `zensical.toml`.

Font downloads use complete URLs from each family's `source.archive` metadata.
Existing hosted archive URLs remain valid, and new fonts can link directly to
upstream releases. Deploying the site does not upload or modify archives.
