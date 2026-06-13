# Hibi Nuclear Player 🌺

A personalized fork of [Nuclear](https://github.com/nukeop/nuclear) — the free, open-source music player — with a custom Last.fm dashboard, lyrics, a Windows Media Player-style visualizer, and more.

> This is a modified version of Nuclear. All credit for the original player goes to [nukeop](https://github.com/nukeop) and the Nuclear contributors. This fork only adds personal features on top of their amazing work.

## ✨ What's different in this version

- **🌺 Hibi Dashboard** — A custom dashboard powered by Last.fm that shows your top artists (with images), recently played tracks, and listening stats. Just enter any Last.fm username to connect.
- **🎤 Lyrics view** — Built-in lyrics that fetch from multiple sources for the currently playing song.
- **🎵 Visualizer** — Real-time audio visualizations that react to the actual frequencies of the music, inspired by the classic Windows Media Player visualizations:
  - **Núcleo** — pulsing concentric rings
  - **Aurora** — flowing organic waves
  - **Battery** — a drifting smoke-like core with rainbow color shifts
  - **Artwork** — large album art display
- **🐛 Bug fix** — Marketplace themes now persist correctly after restarting the app (the original version forgot the selected theme on reboot).
- **🌸 Custom hibiscus icon** — A fresh app icon.
- **🚀 Default view** — Opens straight to the Hibi Dashboard on launch.

## 📦 Installation

Download the latest installer from the [Releases](../../releases) page, or build it yourself:

```bash
pnpm install
pnpm --filter @nuclearplayer/player build
```

The installer will be generated in `packages/player/src-tauri/target/release/bundle/nsis/`.

## 🛠️ Built with

Nuclear is a pnpm monorepo managed with Turborepo. The main app is built with Tauri (Rust + React).

## 🙏 Credits

- Original player: **[Nuclear by nukeop](https://github.com/nukeop/nuclear)**
- This fork & custom features: **[hibimarc-script](https://github.com/hibimarc-script)**

## 📄 License

This project is licensed under **AGPL-3.0**, the same license as the original Nuclear project. See the [LICENSE](./LICENSE) file for details.

Copyright 2025-2026 nukeop (original work) and contributors.
