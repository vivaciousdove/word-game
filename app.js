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

let answer = "";
let attempt = 0;
let gameOver = false;
let hintUsed = false;

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

// ---- Daily mode helpers (UTC date) ----
function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
function hashToIndex(str, mod) {
  // fast deterministic hash (32-bit)
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % mod;
}
function pickDailyWord() {
  const key = todayKeyUTC();
  const idx = hashToIndex(`daily:${key}`, WORDS.length);
  return WORDS[idx];
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

function pickRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

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

function scoreGuess(guess, target) {
  const res = Array(WORD_LEN).fill("gray");
  const targetArr = target.split("");
  const guessArr = guess.split("");

  for (let i = 0; i < WORD_LEN; i++) {
    if (guessArr[i] === targetArr[i]) {
      res[i] = "green";
      targetArr[i] = null;
      guessArr[i] = null;
    }
  }

  for (let i = 0; i < WORD_LEN; i++) {
    if (guessArr[i] == null) continue;
    const idx = targetArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      res[i] = "yellow";
      targetArr[idx] = null;
    }
  }
  return res;
}

function renderRow(rowIndex, guess, colors) {
  const row = boardEl.querySelector(`.board-row[data-row="${rowIndex}"]`);
  if (!row) return;
  const tiles = Array.from(row.children);

  for (let i = 0; i < WORD_LEN; i++) {
    tiles[i].textContent = guess[i].toUpperCase();
    tiles[i].classList.remove("green", "yellow", "gray");
    tiles[i].classList.add(colors[i]);
  }
}

function updateAttempts() {
  attemptsEl.textContent = `Attempt: ${Math.min(attempt + 1, MAX_TRIES)} / ${MAX_TRIES}`;
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

  if (isDailyMode()) {
    msgEl.textContent = `Daily word loaded (${todayKeyUTC()} UTC).`;
  } else {
    msgEl.textContent = "Game on. Enter a 5-letter word.";
  }

  inputEl.value = "";
  inputEl.focus();
}

function giveHint() {
  if (gameOver) return;
  if (hintUsed) return;

  hintUsed = true;
  const revealIndex = Math.floor(Math.random() * WORD_LEN);
  hintEl.textContent = `Hint: letter ${revealIndex + 1} is "${answer[revealIndex].toUpperCase()}"`;
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
renderMode();
newGame();
