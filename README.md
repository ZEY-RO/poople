# 💩 POOPLE — The Word Ladder Game to POOP

A complete, feature-rich word ladder puzzle game built for the browser. Transform any 4-letter starting word into **"POOP"** one valid letter at a time!

[![Play Poople Live](https://img.shields.io/badge/🎮%20Play%20Online-Live%20Demo-emerald?style=for-the-badge&logo=googlechrome)](https://poople.site/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/ZEY-RO/poople)

🌐 **Live Game URL**: [https://poople.site/](https://poople.site/)

---

## 🎮 Game Modes

- 📅 **Daily Poople**: Date-seeded daily puzzle with streak tracking, midnight countdown, and a 30-day calendar archive.
- ♾️ **Unlimited Mode**: Endless random solvable ladders across 4 difficulty tiers (*Easy, Medium, Hard, Master*).
- ⚡ **Poop Rush**: 2-minute fast-paced time attack challenge with dynamic timer bars, combo multipliers, skip penalties, and high-score records.
- 🤖 **Versus Bot (AI Toilet Battle)**: Real-time head-to-head race against 3 AI opponents (*Sloppy Plunger, Speedy Flush, Grandmaster Commode*) with animated live race tracks.
- 🏆 **The Gauntlet (50-Stage Campaign)**: 50 hand-crafted progression stages across 5 themed chapters with a 3-star Par rating system.
- 🎨 **Custom Puzzle Builder**: Create custom starting & target words with real-time solvability testing and shareable URL query parameters.

---

## ✨ Features & Polish

- 🧠 **BFS Graph Solver**: Instant minimum move (Par) calculation and optimal path finder.
- 💡 **Smart Hint System**: Multi-tier clues (letter position, definition clue, word reveal, legal moves peek).
- 📚 **Word Definitions**: Tap any ladder word to view its dictionary definition.
- 🎵 **Procedural Web Audio Engine**: Client-side sound effects (plunger pops, key clicks, rubber duck squeaks, toilet flush whoosh, victory fanfare) with 3 sound styles (*Cartoon, Arcade, Clean*).
- 🎨 **6 Custom Themes**: *Classic Porcelain, Poop Delight, Midnight Flush (Dark OLED), Retro 8-Bit, Golden Throne, and Pastel Washroom*.
- 🎆 **Victory & Sharing**: Confetti showers, animated step replay, side-by-side optimal route comparison, and Wordle/Weaver style shareable emoji scorecards.
- ⌨️ **Accessibility**: Physical and on-screen keyboard support (**QWERTY**, **AZERTY**, **Dvorak**, **ABC**), Hard Mode toggle, and Dead-End Radar.

---

## 🛠️ Quick Start

```bash
# Clone repository
git clone https://github.com/ZEY-RO/poople.git
cd poople

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
npm run preview
```

## Verification

```bash
npm test       # Engine, puzzle, storage, and optional-service regressions
npm run build  # TypeScript and production bundle
npm run check:seo # Verify the generated HTML, canonical URLs, sitemap, and assets
```

For browser checks, start the local app and use Playwright CLI:

```bash
playwright-cli open http://localhost:5173
playwright-cli run-code --filename=tests/ui-smoke.js
```

Use the port printed by Vite if 5173 is already in use. The browser checks use an isolated context and cover daily save/restore, archive links, keyboard input, dialogs, Rush expiration, bot rematches, campaign progression, and narrow mobile screens. Development analytics stay local; production can use the configured Supabase service.

## Search visibility

The production build generates eight static HTML pages: the homepage, five mode pages, and the How to Play and Word Ladder Strategies guides. Each has a distinct title, description, canonical URL, social preview, visible content, and factual structured data. The guides work without JavaScript and do not load the game bundle. `src/seo/content.ts` is the source for the page content; the Vite build generates `dist/sitemap.xml` from the same destinations without invented modification dates.

Mode links use real URLs that work when opened directly on GitHub Pages. Old `?mode=` bookmarks redirect to the matching mode page, while custom puzzle and daily archive links remain supported. Query variations canonicalize to their underlying page.

For the production browser checks, build and start `npm run preview`, open its printed URL with Playwright CLI, then run:

```bash
playwright-cli run-code --filename=tests/ui-seo.js
```

This covers all eight pages with JavaScript disabled, mobile layouts, metadata, and old shared links. The deployment workflow runs unit regressions, the production build, and `check:seo` before uploading to Pages.

After publishing, submit [the sitemap](https://poople.site/sitemap.xml) in the verified Google Search Console property, inspect the homepage and new mode URLs, and monitor Pages and Performance reports. Compare search clicks, impressions, CTR, and queries over consistent date ranges as Google recrawls. Useful links from relevant game communities and original puzzle content can help people discover Poople; avoid purchased links or automated submissions. Search rankings and indexing are determined by Google.

---

## 📜 License

MIT License
