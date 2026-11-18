---
icon: lucide/heart-handshake
---

# Contributing

Tiparo is a personal library. Metadata and licensing corrections are welcome
through [issues](https://github.com/leightonpayne/tiparo/issues) or pull requests.

See [installation](installation.md) for setup and [adding fonts](../operations/adding-fonts.md)
for content changes. Regenerate and commit `src/data/generated-font-library.ts`
and `src/data/generated-fonts.css` when font metadata or preview assets change.

Before committing, run the checks relevant to your change:

| Change | Check |
| --- | --- |
| App or content pipeline | `aube test` and `aube run build` |
| Docs | `aube run docs:build` |
| Deployment | `aube run pages:build` |
