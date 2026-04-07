# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ODGG is a static website hosted on GitHub Pages at **odgg.org** (see CNAME). It is a French-language app for a group called "Comité ODGG" with three interconnected pages sharing a single Firebase Realtime Database backend.

## Architecture

**No build system** — pure vanilla HTML/CSS/JS with inline `<style>` and `<script>` tags. Each page is a self-contained `.html` file. To develop, just open the HTML files in a browser.

### Pages

- **index.html** (Comité) — Member management: add/remove members, edit roles. Data at `comite/members`.
- **cruche.html** (Cruche) — Score leaderboard sorted by descending score. Reads from `comite/members`, admins can increment/decrement scores.
- **empereur.html** (Empereur) — Countdown timer game. Players are added from the comité member list, eliminated during rounds. Timer auto-advances through 15 rounds (15min down to 1min), then loops. Data at `game/timer` and `game/players`.

### Shared Patterns

- **Firebase config** is duplicated in each HTML file (Firebase compat SDK v10.12.4 loaded via CDN).
- **Admin auth** is the same across all pages: password stored at `config/adminPass` in Firebase, session persisted via `localStorage('odgg_admin')`. Admin mode toggles a `is-admin` body class and shows/hides admin controls.
- **`escHtml()` utility** is duplicated in each file for XSS prevention.
- **Design system**: dark theme (`#0f0f1a` background), accent `#6c63ff`, shared nav bar with pill-style links. CSS is duplicated per page with minor variations.

### Firebase Database Structure

```
config/adminPass        — string
comite/members/{id}     — { name, role, score, createdAt }
game/timer              — { running, endTime, secondsLeft, totalSeconds, globalTour, loopCount, currentMinutes }
game/players/{id}       — { name, eliminated, tourStopped, order }
```

### Key Implementation Details

- `empereur.html` uses `firebase.database.ServerValue.TIMESTAMP` indirectly via server time offset (`.info/serverTimeOffset`) for synchronized countdown across clients.
- Timer round advancement uses a Firebase `transaction()` to avoid race conditions between multiple admin clients.
- `index.html` uses `var` declarations (ES5 style) while `cruche.html` and `empereur.html` use `const`/`let` (ES6).
