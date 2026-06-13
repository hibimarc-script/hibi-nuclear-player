# Hibi Nuclear Player 🌺 ⚠️ This is an unofficial personal fork and is not affiliated with or endorsed by the official Nuclear project.

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

## 🔌 Plugins (important!)

Some features rely on custom plugins that are **not bundled inside the installer** — they live in a separate folder per user and must be added manually inside Nuclear.

To install them:

1. Create a folder on your local disk for the plugins, for example: C:\nuclear-plugins\

2. Copy the plugin folders from this repo (e.g. `hibi-youtube-playlists`) into that folder. Each plugin should keep its own subfolder with its `package.json` and `index.ts`.
3. Open Nuclear and go to **Preferences → Plugins**.
4. Click **Add Plugin** and select the plugin's folder (e.g. `C:\nuclear-plugins\hibi-youtube-playlists`).
5. The plugin will be installed and enabled automatically.

> **Note:** Nuclear copies the plugin into its own data folder when you add it. To update a plugin after changing its code, remove it in Nuclear and add it again.

### Available plugins

- **Hibi YouTube Playlists** — Import YouTube and YouTube Music playlists directly into your library without needing yt-dlp.
- Hibi Lyrics
- I've also added a youtube stream plug in from the original creator NukeOP due to this one work perfect for streaming

## 🛠️ Built with

Nuclear is a pnpm monorepo managed with Turborepo. The main app is built with Tauri (Rust + React).

## 🙏 Credits

Thanks a lot for creating this amazing player!
- Original player: **[Nuclear by nukeop](https://github.com/nukeop/nuclear)**
- This fork & custom features: **[hibimarc-script](https://github.com/hibimarc-script)**

## 📄 License

This project is licensed under **AGPL-3.0**, the same license as the original Nuclear project. See the [LICENSE](./LICENSE) file for details.

Copyright 2025-2026 nukeop (original work) and contributors.
