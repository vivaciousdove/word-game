# Word Guess Game

A Wordle-style word guessing game built with **HTML, CSS, and JavaScript**.  
Built as a lightweight, production-hosted MVP to demonstrate shipping, deployment, and QA-minded iteration.

## Live Demo
https://todd-word-guess.netlify.app/

## Why this exists (QA + portfolio gateway)
This project is intentionally small but complete:
- **Shippable UI** with clear game rules and feedback
- **Deterministic “Daily” mode** (same word for everyone via UTC date)
- **Local persistence** using `localStorage` (streak/best)
- **Static hosting + CI/CD** via GitHub → Netlify auto-deploy

If you’re reviewing this as a recruiter/client: this is a quick example of how I build, validate, and publish a working web app.

## Features
- 5-letter word guessing in **6 tries**
- **Daily mode** (UTC-based) + non-daily play
- **Hint toggle**
- On-screen keyboard + input box support
- Streak + best tracking (stored locally)

## Tech Stack
- HTML (layout)
- CSS (dark UI styling)
- JavaScript (game logic)

## Run Locally
Option A (simple):
- Open `index.html` in a browser.

Option B (recommended during development):
- Use VS Code Live Server.

## Deploy
This is a static site.
- Hosted on **Netlify** with **GitHub connected** (auto-deploy on push to `main`).

## Repo Notes
- No backend required (pure static app)
- `localStorage` stores streak/best on the current device/browser

## Roadmap Ideas
- Share results (copy-to-clipboard string)
- Difficulty modes (common vs rare words)
- Mini analytics (plays per day)
- Optional backend later (leaderboard, accounts)

