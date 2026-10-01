# 🎮 2048 — Sliding Tile Puzzle

**The addictive sliding-tile classic, rebuilt from scratch in vanilla JavaScript.**

Slide the tiles with your arrow keys (or swipe on mobile), merge matching numbers, and chase the legendary **2048** tile. Smooth slide animations, a pop effect on every merge, live score tracking, and a persistent best score saved in your browser.

## ✨ Features

- 🧩 Full 2048 rules — slide, merge once per turn, spawn 2s and 4s
- 🎞️ Smooth sliding tile animations + pop effect on merges
- 🏆 Live score, persistent **best score** (localStorage)
- 🎉 Win overlay at 2048 with a "keep going" option, game-over detection
- ⌨️ Arrow keys + WASD support, 📱 swipe controls for touch screens
- 📐 Responsive board that re-aligns tiles on window resize
- 🎨 The classic 2048 color palette

## 🚀 Run it in 30 seconds

No build tools, no dependencies — just static files.

1. Download `index.html`, `style.css`, and `game.js` into the same folder
2. Double-click `index.html` — it opens in your browser
3. Press an arrow key and start sliding!

Or serve it locally: `npx serve .` (or `python3 -m http.server`) and open the shown URL.

## 🎮 What you'll see

The familiar beige board with rounded empty cells. Two tiles spawn to start. Every arrow press slides all tiles with a smooth animation; equal tiles collide and merge with a satisfying pop while your score climbs. Hit 2048 and you get the win screen — or keep pushing for 4096 and beyond.

## 🧠 What I practiced (Day 6 of my daily coding journey)

- Modeling game state as a 2D grid of tile objects
- The classic 2048 move algorithm: traversal order, farthest-position search, single-merge-per-turn rule
- Animating DOM elements with CSS `transform` transitions keyed by stable tile IDs
- Handling both keyboard and touch-swipe input
- Persisting a high score with `localStorage`
- Keeping game logic, styling, and markup in clean separate files

---

*Day 6 · featured build of my daily coding journey — the classic 2048 sliding-tile game.*
