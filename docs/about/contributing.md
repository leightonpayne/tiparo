---
icon: lucide/heart-handshake
---

# Contributing

Tiparo is primarily a personal type library, so contributions are not expected. Still, corrections to font metadata and licensing are welcome through [issue](https://github.com/leightonpayne/tiparo/issues) or [pull request](https://github.com/leightonpayne/tiparo/pulls) submissions.

## Quick Start

```bash
git clone https://github.com/leightonpayne/tiparo
cd tiparo
aube install
uv sync --group docs
```

## Development Commands

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `aube run dev`         | Start the app locally             |
| `aube run build`       | Build the app                     |
| `aube run docs:serve`  | Serve docs locally                |
| `aube run docs:build`  | Build docs locally                |
| `aube run pages:build` | Build the combined Pages artifact |

## Project Structure

```text
content/   # font metadata, tracked previews, archive config
docs/      # docs source
scripts/   # content and deployment helpers
src/       # React app
```

## Making Changes

1. Make the smallest coherent change.
2. If you changed app behavior, run `aube run build`.
3. If you changed docs, run `aube run docs:build`.
4. If you changed deployment-relevant behavior, run `aube run pages:build`.

## Submitting Changes

1. Open an issue or start a discussion first if the change is substantial.
2. Keep content edits, styling changes, and deployment changes clearly scoped.
3. Make sure generated files are up to date before opening a pull request.

## Content Changes

For changes involving fonts:

1. Update `family.toml`.
2. Sync tracked preview assets with `aube run fonts:sync -- <font-id>`.
3. Regenerate the runtime manifest via `aube run content:sync` or any normal app build.
