const WORDS = [
  "cloud","tests","trace","build","debug","squad","audit","hooks","token","login",
  "proxy","suite","shift","scope","stack","merge","deploy","alert","route","model"
];

const MAX_TRIES = 6;
const WORD_LEN = 5;

const boardEl = document.getElementById("board");
const formEl = document.getElementById("guessForm");
const inputEl = document.getElementById("guessInput");
const msgEl = document.getElementById("message");
const attemptsEl = document.getElementById("attempts");
const hintEl = document.getElementById("hint");
const newGameBtn = document.getElementById("newGameBtn");
const dailyBtn = document.getElementById("dailyBtn");
const hintBtn = document.getElementById("hintBtn");
const streakEl = document.getElementById("streak");
const bestStreakEl = document.getElementById("bestStreak");
const keyboardEl = document.getElementById("keyboard");

let answer = "";
let attempt = 0;
let gameOver = false;
let hintUsed = false;

const keyState = {}; // letter -> "gray" | "yellow" | "green"
const rank = { gray: 1, yellow: 2, green: 3 };

// ----- storage helpers -----
function getNum(key, fallback = 0) {
  const v = Number(localStorage.getItem(key));
  return Number.isFinite(v) ? v : fallback;
}
function setNum(key, val) {
  localStorage.setItem(key, String(val));
}
function getStr(key, fallback = "") {
  const v = localStorage.getItem(key);
  return v == null ? fallback : v;
}
function setStr(key, val) {
  localStorage.setItem(key, String(val));
}

// ----- streak logic -----
function renderStreak() {
  streakEl.textContent = `Streak: ${getNum("streak")}`;
  bestStreakEl.textContent = `Best: ${getNum("bestStreak")}`;
}
function winStreak() {
  const s = getNum("streak") + 1;
  setNum("streak", s);
  setNum("bestStreak", Math.max(getNum("bestStreak"), s));
  renderStreak();
}
function resetStreak() {
  setNum("streak", 0);
  renderStreak();
}

// ----- daily word helpers -----
function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10);
}
function hashToIndex(str, mod) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % mod;
}
function pickDailyWord() {
  const key = todayKeyUTC();
  return WORDS[hashToIndex(`daily:${key}`, WORDS.length)];
}
function isDailyMode() {
  return getStr("mode", "random") === "daily";
}
function setDailyMode(on) {
  setStr("mode", on ? "daily" : "random");
  renderMode();
}
function renderMode() {
  dailyBtn.textContent = `Daily: ${isDailyMode() ? "On" : "Off"}`;
}

// ----- board -----
function buildBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < MAX_TRIES; r++) {
    const row = document.createElement("div");
    row.className = "board-row";
    row.dataset.row = String(r);
    for (let c = 0; c < WORD_LEN; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = "";
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
  }
}

function updateAttempts() {
  attemptsEl.textContent = `Attempt: ${Math.min(attempt + 1, MAX_TRIES)} / ${MAX_TRIES}`;
}

function scoreGuess(guess, target) {
  const res = Array(WORD_LEN).fill("gray");
  const t = target.split("");
  const g = guess.split("");

  for (let i = 0; i < WORD_LEN; i++) {
    if (g[i] === t[i]) {
      res[i] = "green";
      t[i] = null;
      g[i] = null;
    }
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (g[i] == null) continue;
    const idx = t.indexOf(g[i]);
    if (idx !== -1) {
      res[i] = "yellow";
      t[idx] = null;
    }
  }
  return res;
}

function renderRow(rowIndex, guess, colors) {
  const row = boardEl.querySelector(`.board-row[data-row="${rowIndex}"]`);
  const tiles = Array.from(row.children);
  for (let i = 0; i < WORD_LEN; i++) {
    tiles[i].textContent = (guess[i] || "").toUpperCase();
    tiles[i].classList.remove("green", "yellow", "gray");
    if (guess[i]) tiles[i].classList.add(colors[i]);
  }
}

function bumpKey(letter, color) {
  const L = letter.toLowerCase();
  const prev = keyState[L];
  if (!prev || rank[color] > rank[prev]) keyState[L] = color;
}

function renderKeyboardColors() {
  keyboardEl.querySelectorAll(".key[data-key]").forEach(btn => {
    const k = btn.dataset.key;
    btn.classList.remove("green", "yellow", "gray");
    const s = keyState[k];
    if (s) btn.classList.add(s);
  });
}

// ----- keyboard -----
const KEY_LAYOUT = [
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l"],
  ["enter","z","x","c","v","b","n","m","back"]
];

function buildKeyboard() {
  keyboardEl.innerHTML = "";
  KEY_LAYOUT.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "krow";
    row.forEach(k => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key";
      if (k === "enter" || k === "back") btn.classList.add("wide");
      btn.textContent = k === "back" ? "⌫" : k;
      if (k === "enter") btn.textContent = "Enter";
      btn.dataset.key = k.length === 1 ? k : "";
      btn.dataset.action = k; // enter/back or letter
      rowEl.appendChild(btn);
    });
    keyboardEl.appendChild(rowEl);
  });

  keyboardEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button.key");
    if (!btn || gameOver) return;
    const action = btn.dataset.action;

    if (action === "enter") {
      formEl.requestSubmit();
      return;
    }
    if (action === "back") {
      inputEl.value = inputEl.value.slice(0, -1);
      inputEl.focus();
      return;
    }
    if (action.length === 1) {
      if (inputEl.value.length < WORD_LEN) {
        inputEl.value += action;
        inputEl.focus();
      }
    }
  });
}

document.addEventListener("keydown", (e) => {
  if (gameOver) return;

  const k = e.key.toLowerCase();
  if (k === "enter") {
    e.preventDefault();
    formEl.requestSubmit();
    return;
  }
  if (k === "backspace") {
    return; // native input handling
  }
  if (/^[a-z]$/.test(k)) {
    // let the input handle it, but enforce max len quickly
    setTimeout(() => {
      inputEl.value = (inputEl.value || "").slice(0, WORD_LEN);
    }, 0);
  }
});

// ----- hints + game loop -----
function pickRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function newGame() {
  answer = isDailyMode() ? pickDailyWord() : pickRandomWord();

  attempt = 0;
  gameOver = false;
  hintUsed = false;
  hintEl.textContent = "";
  buildBoard();
  updateAttempts();
  renderStreak();
  renderMode();

  Object.keys(keyState).forEach(k => delete keyState[k]);
  renderKeyboardColors();

  msgEl.textContent = isDailyMode()
    ? `Daily word loaded for ${todayKeyUTC()} UTC`
    : "Game on. Enter a 5-letter word.";

  inputEl.value = "";
  inputEl.focus();
}

function giveHint() {
  if (gameOver || hintUsed) return;
  hintUsed = true;
  const i = Math.floor(Math.random() * WORD_LEN);
  hintEl.textContent = `Hint: letter ${i + 1} is "${answer[i].toUpperCase()}"`;
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  if (gameOver) return;

  const guess = (inputEl.value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (guess.length !== WORD_LEN) {
    msgEl.textContent = "Enter exactly 5 letters.";
    return;
  }

  const colors = scoreGuess(guess, answer);
  renderRow(attempt, guess, colors);

  // update keyboard state
  for (let i = 0; i < WORD_LEN; i++) {
    bumpKey(guess[i], colors[i]);
  }
  renderKeyboardColors();

  if (guess === answer) {
    gameOver = true;
    winStreak();
    msgEl.textContent = `✅ You got it! The word was "${answer.toUpperCase()}".`;
    return;
  }

  attempt += 1;
  updateAttempts();

  if (attempt >= MAX_TRIES) {
    gameOver = true;
    resetStreak();
    msgEl.textContent = `❌ Out of tries. The word was "${answer.toUpperCase()}".`;
    return;
  }

  msgEl.textContent = "Not quite. Try again.";
  inputEl.value = "";
  inputEl.focus();
});

newGameBtn.addEventListener("click", newGame);
hintBtn.addEventListener("click", giveHint);
dailyBtn.addEventListener("click", () => {
  setDailyMode(!isDailyMode());
  newGame();
});

// init
buildKeyboard();
renderMode();
newGame();
