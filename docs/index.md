---
icon: lucide/type
---

# Tiparo

<p align="center">
  <img src="static/tiparo.svg" width="40%" alt="tiparo logo">
</p>

## Overview

`tiparo` is a personal type library presented as a small web app. It combines a React/Vite frontend with a content pipeline that turns local font metadata and preview assets into a generated runtime manifest.

## What it is for

Tiparo is meant to make it easy to browse, preview, compare, and download a curated set of typefaces from one place. It keeps the app bundle focused on preview assets while full upstream sources and release archives are managed separately.

## What lives here

- [Architecture](operations/architecture.md)
  The full end-to-end explanation of how the app, content pipeline, runtime font loading, and archive publishing fit together.
- [family.toml reference](reference/family-toml.md)
  The source format for a font family.
- [Runtime manifest reference](reference/runtime-manifest.md)
  The generated data model consumed by the app.
- [Adding fonts](operations/adding-fonts.md)
  The practical workflow for introducing a new family.
- [Publishing archives](operations/publishing-archives.md)
  How full upstream archives become R2 download URLs.
- [Deployment](operations/deployment.md)
  How the app and downloads are hosted.

## Getting Started

Start with:

- [Architecture](operations/architecture.md)
- [Adding Fonts](operations/adding-fonts.md)
- [Publishing Archives](operations/publishing-archives.md)
