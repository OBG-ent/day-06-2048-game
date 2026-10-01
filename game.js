/* ============================================================
   2048 — game logic (vanilla JS, no dependencies)
   How it works:
   - The board is a 4x4 grid. Each cell holds a tile object or null.
   - A move slides every tile as far as it can go in one direction,
     merging equal tiles once per turn (classic 2048 rules).
   - Tile DOM nodes are kept in a Map keyed by tile id, so slides
     animate smoothly via CSS transform transitions.
   ============================================================ */

const SIZE = 4;        // 4x4 board
const GAP = 14;        // px — must match the CSS grid gap/padding
const WIN_VALUE = 2048;
const BEST_KEY = "day06-2048-best";

// Directions: 0 = up, 1 = right, 2 = down, 3 = left
const VECTORS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

// ---- Game state ----
let grid;            // 2D array: tile object {id, value, row, col} or null
let score, best;
let over, won, keepPlaying;
let nextId = 1;
const tileNodes = new Map(); // tile id -> DOM element

// ---- DOM refs ----
const boardEl = document.getElementById("board");
const gridEl = document.getElementById("grid");
const tilesEl = document.getElementById("tiles");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlayEl = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMsg = document.getElementById("overlayMsg");
const keepGoingBtn = document.getElementById("keepGoingBtn");

/* ---------- Board setup ---------- */

// Draw the 16 empty background cells once
function buildBackground() {
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    gridEl.appendChild(cell);
  }
}

function newGame() {
  grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  score = 0;
  over = false;
  won = false;
  keepPlaying = false;
  nextId = 1;
  tileNodes.clear();
  tilesEl.innerHTML = "";
  addRandomTile();
  addRandomTile();
  updateScores();
  hideOverlay();
  render();
}

/* ---------- Tile spawning ---------- */

function emptyCells() {
  const cells = [];
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      if (!grid[y][x]) cells.push({ x, y });
  return cells;
}

// Drop a 2 (90%) or 4 (10%) into a random empty cell
function addRandomTile() {
  const empty = emptyCells();
  if (!empty.length) return;
  const { x, y } = empty[Math.floor(Math.random() * empty.length)];
  grid[y][x] = { id: nextId++, value: Math.random() < 0.9 ? 2 : 4, row: y, col: x, isNew: true };
}

/* ---------- Movement (the heart of 2048) ---------- */

function withinBounds(p) {
  return p.x >= 0 && p.x < SIZE && p.y >= 0 && p.y < SIZE;
}

function cellContent(p) {
  return withinBounds(p) ? grid[p.y][p.x] : null;
}

// Order cells so we process the "leading edge" first for each direction
function buildTraversals(vector) {
  const t = { x: [], y: [] };
  for (let i = 0; i < SIZE; i++) { t.x.push(i); t.y.push(i); }
  if (vector.x === 1) t.x.reverse();
  if (vector.y === 1) t.y.reverse();
  return t;
}

// Slide from `cell` along `vector` until blocked; returns farthest
// open cell and the cell right after it (merge candidate)
function findFarthestPosition(cell, vector) {
  let previous = cell;
  let current = { x: cell.x + vector.x, y: cell.y + vector.y };
  while (withinBounds(current) && !cellContent(current)) {
    previous = current;
    current = { x: previous.x + vector.x, y: previous.y + vector.y };
  }
  return { farthest: previous, next: current };
}

function move(direction) {
  if (over || (won && !keepPlaying)) return;

  const vector = VECTORS[direction];
  const traversals = buildTraversals(vector);
  const dying = []; // consumed tiles, kept briefly so merges animate
  let moved = false;

  // Reset per-turn flags
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const t = grid[y][x];
      if (t) { t.mergedThisTurn = false; t.isNew = false; t.justMerged = false; }
    }

  traversals.x.forEach((x) => {
    traversals.y.forEach((y) => {
      const tile = grid[y][x];
      if (!tile) return;

      const positions = findFarthestPosition({ x, y }, vector);
      const next = cellContent(positions.next);

      // Merge: same value, and the target hasn't merged this turn
      if (next && next.value === tile.value && !next.mergedThisTurn) {
        const merged = {
          id: nextId++,
          value: tile.value * 2,
          row: positions.next.y,
          col: positions.next.x,
          mergedThisTurn: true,
          justMerged: true, // triggers the pop animation
        };
        grid[positions.next.y][positions.next.x] = merged;
        grid[y][x] = null;
        score += merged.value;
        dying.push({ tile, toRow: positions.next.y, toCol: positions.next.x });
        if (merged.value === WIN_VALUE) won = true;
        moved = true;
      } else if (positions.farthest.x !== x || positions.farthest.y !== y) {
        // Plain slide into the farthest open cell
        grid[positions.farthest.y][positions.farthest.x] = tile;
        grid[y][x] = null;
        tile.row = positions.farthest.y;
        tile.col = positions.farthest.x;
        moved = true;
      }
    });
  });

  if (!moved) return; // invalid move — don't spawn a tile

  addRandomTile();
  if (score > best) {
    best = score;
    localStorage.setItem(BEST_KEY, String(best));
  }
  updateScores();
  render(dying);

  if (won && !keepPlaying) {
    showOverlay("win");
  } else if (!movesAvailable()) {
    over = true;
    showOverlay("over");
  }
}

// Any empty cell, or any adjacent equal pair, means the game continues
function movesAvailable() {
  if (emptyCells().length > 0) return true;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const v = grid[y][x].value;
      if (x + 1 < SIZE && grid[y][x + 1].value === v) return true;
      if (y + 1 < SIZE && grid[y + 1][x].value === v) return true;
    }
  return false;
}

/* ---------- Rendering ---------- */

// Tile size in px, derived from the live board width so it stays
// perfectly aligned with the CSS background grid
function tileSize() {
  return (boardEl.clientWidth - GAP * (SIZE + 1)) / SIZE;
}

function position(row, col) {
  const s = tileSize();
  return { x: GAP + col * (s + GAP), y: GAP + row * (s + GAP) };
}

function render(dying = []) {
  const s = tileSize();
  const seen = new Set();

  // Sync every live tile with its DOM node (created once, moved by CSS transition)
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const t = grid[y][x];
      if (!t) continue;
      seen.add(t.id);

      let el = tileNodes.get(t.id);
      if (!el) {
        el = document.createElement("div");
        tileNodes.set(t.id, el);
        tilesEl.appendChild(el);
      }
      el.className =
        "tile tile-" + t.value +
        (t.isNew ? " tile-new" : "") +
        (t.justMerged ? " tile-merged" : "");
      el.textContent = t.value;
      el.style.width = el.style.height = s + "px";
      const { x: px, y: py } = position(t.row, t.col);
      el.style.transform = `translate(${px}px, ${py}px)`;
    }

  // Remove nodes for tiles that no longer exist (not consumed by a merge)
  for (const [id, el] of tileNodes) {
    if (!seen.has(id) && !dying.some((d) => d.tile.id === id)) {
      el.remove();
      tileNodes.delete(id);
    }
  }

  // Animate consumed tiles sliding into their merge target, then remove them
  dying.forEach((d) => {
    let el = tileNodes.get(d.tile.id);
    if (!el) {
      el = document.createElement("div");
      tileNodes.set(d.tile.id, el);
      tilesEl.appendChild(el);
    }
    el.className = "tile tile-" + d.tile.value;
    el.textContent = d.tile.value;
    el.style.width = el.style.height = s + "px";
    const { x: px, y: py } = position(d.toRow, d.toCol);
    el.style.transform = `translate(${px}px, ${py}px)`;
    const id = d.tile.id;
    setTimeout(() => {
      const node = tileNodes.get(id);
      if (node) { node.remove(); tileNodes.delete(id); }
    }, 150);
  });
}

/* ---------- Score / overlay UI ---------- */

function updateScores() {
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function showOverlay(kind) {
  if (kind === "win") {
    overlayTitle.textContent = "🎉 You win!";
    overlayMsg.textContent = `You reached ${WIN_VALUE} with a score of ${score}. Keep going for an even bigger tile?`;
    keepGoingBtn.hidden = false;
  } else {
    overlayTitle.textContent = "Game over!";
    overlayMsg.textContent = `No more moves. Final score: ${score}.`;
    keepGoingBtn.hidden = true;
  }
  overlayEl.hidden = false;
}

function hideOverlay() {
  overlayEl.hidden = true;
}

/* ---------- Input: keyboard + touch ---------- */

document.addEventListener("keydown", (e) => {
  const keyMap = {
    ArrowUp: 0, w: 0, W: 0,
    ArrowRight: 1, d: 1, D: 1,
    ArrowDown: 2, s: 2, S: 2,
    ArrowLeft: 3, a: 3, A: 3,
  };
  if (e.key in keyMap) {
    e.preventDefault(); // stop the page scrolling on arrow keys
    move(keyMap[e.key]);
  }
});

let touchStart = null;
boardEl.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

boardEl.addEventListener("touchend", (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; // ignore taps
  // Swipe in the dominant axis direction
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
}, { passive: true });

// Re-align tiles if the window resizes mid-game
window.addEventListener("resize", () => render());

/* ---------- Buttons ---------- */

document.getElementById("newGameBtn").addEventListener("click", newGame);
document.getElementById("overlayNewGameBtn").addEventListener("click", newGame);
keepGoingBtn.addEventListener("click", () => {
  keepPlaying = true;
  hideOverlay();
});

/* ---------- Go ---------- */

best = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
buildBackground();
newGame();
