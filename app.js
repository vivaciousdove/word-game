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
const hintBtn = document.getElementById("hintBtn");

let answer = "";
let attempt = 0;
let gameOver = false;
let hintUsed = false;

function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function setMessage(text) {
  msgEl.textContent = text;
}

function sanitizeGuess(raw) {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
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
  // returns array of "green" | "yellow" | "gray"
  const res = Array(WORD_LEN).fill("gray");
  const targetArr = target.split("");
  const guessArr = guess.split("");

  // First pass: greens
  for (let i = 0; i < WORD_LEN; i++) {
    if (guessArr[i] === targetArr[i]) {
      res[i] = "green";
      targetArr[i] = null; // consume
      guessArr[i] = null;
    }
  }

  // Second pass: yellows
  for (let i = 0; i < WORD_LEN; i++) {
    if (guessArr[i] == null) continue;
    const idx = targetArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      res[i] = "yellow";
      targetArr[idx] = null; // consume
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
  answer = pickWord();
  attempt = 0;
  gameOver = false;
  hintUsed = false;
  hintEl.textContent = "";
  buildBoard();
  updateAttempts();
  setMessage("Game on. Enter a 5-letter word.");
  inputEl.value = "";
  inputEl.focus();
}

function giveHint() {
  if (gameOver) return;
  if (hintUsed) {
    setMessage("Hint already used. You got this.");
    return;
  }
  hintUsed = true;

  const revealIndex = Math.floor(Math.random() * WORD_LEN);
  hintEl.textContent = `Hint: letter ${revealIndex + 1} is "${answer[revealIndex].toUpperCase()}"`;
  setMessage("Hint dropped. Use it wisely.");
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  if (gameOver) return;

  const guess = sanitizeGuess(inputEl.value);

  if (guess.length !== WORD_LEN) {
    setMessage("Enter exactly 5 letters.");
    return;
  }

  const colors = scoreGuess(guess, answer);
  renderRow(attempt, guess, colors);

  if (guess === answer) {
    gameOver = true;
    setMessage(`✅ You got it! The word was "${answer.toUpperCase()}".`);
    return;
  }

  attempt += 1;
  updateAttempts();

  if (attempt >= MAX_TRIES) {
    gameOver = true;
    setMessage(`❌ Out of tries. The word was "${answer.toUpperCase()}".`);
    return;
  }

  setMessage("Not quite. Try again.");
  inputEl.value = "";
  inputEl.focus();
});

newGameBtn.addEventListener("click", newGame);
hintBtn.addEventListener("click", giveHint);

newGame();
