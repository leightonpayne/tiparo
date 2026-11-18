---
icon: lucide/download
---

# Installation

Use Node.js 24+ and [aube](https://aube.sh/) 2.1.0:

```bash
git clone https://github.com/leightonpayne/tiparo
cd tiparo
aube install
aube run dev
```

The app builds from tracked previews; full upstream files are only needed to
sync previews. The project keeps dependencies local so React and its types
resolve to the versions in the lockfile.

The dev command refreshes Vite's dependency cache on startup. Vite 8.0.8 does not
recognize Aube's lockfile, so this prevents stale paths after dependencies change.

For the docs, install `uv`, then run:

```bash
uv sync --group docs
aube run docs:serve
```

| Command                | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `aube run dev`         | Regenerate font data and start Vite                            |
| `aube test`            | Run regression tests                                           |
| `aube run build`       | Regenerate font data, check TypeScript, build app into `dist/` |
| `aube run preview`     | Serve the existing app build locally                           |
| `aube run docs:serve`  | Preview docs locally                                           |
| `aube run docs:build`  | Build docs into `dist/docs/`                                   |
| `aube run pages:build` | Build app, then docs, for deployment                           |

The app build clears `dist/`, so use `pages:build` when you need both outputs.

Docs commands render `docs/diagrams/*.mmd` to static SVGs with Pele. After editing
diagram sources while the docs server is running, run `aube run docs:diagrams`
to refresh the images. Generated files in `docs/static/diagrams/` are ignored by
git. Run a new app build before `preview` to see metadata or font changes.

To expose the dev server over your tailnet, replace `your-host.ts.net` with its
MagicDNS hostname:

```bash
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=your-host.ts.net aube run dev --host
```
