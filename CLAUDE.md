# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Chromium MV3 browser extension that limits time on distracting sites and gates access on completing daily tasks (Study4 + LeetCode). Local-only, no network, no telemetry. See README.md for the user-facing feature list.

## Build / run / test

There is **no build step, no bundler, no test suite, no linter config**. Source files are loaded directly by the browser as an unpacked extension.

- **Load** — `brave://extensions` (or `chrome://extensions`) → enable Developer mode → Load unpacked → select repo root.
- **Iterate** — after editing background/manifest, click the reload icon for the extension on the extensions page. UI files (popup/options/block) reload on next open.
- **Inspect** — right-click the extension icon → Inspect popup; on the extensions page, click the service worker link to open DevTools for `background.js`.

Markdown is lint-checked by the editor (markdownlint). No CI.

## Architecture

The service worker is the single source of truth for policy. UI surfaces are stateless views that round-trip through `chrome.runtime.sendMessage`.

**State layer (`storage.js`)** — Only module that touches `chrome.storage.local`. Exports `getState()` / `saveState()`, plus pure helpers `matchDomain()`, `findTask()`, `matchTracked()`, `isPathBlocked()`, `taskComplete()`, `allTasksComplete()`, `fmtSeconds()`. `getState()` is also the lazy daily-reset path: it compares `state.date` to `todayStr()` and clears `usage` if rolled. Imported by both the service worker and HTML pages — keep it free of `chrome.tabs` / `chrome.runtime` calls.

**Task model** — Tasks are configurable (`settings.tasks: [{id, domain, requiredMinutes}]`). Completion is *derived* from `usage[task.domain] >= requiredMinutes * 60`, not stored as a flag. The background tracks active time on task domains the same way it tracks distracting domains — both flow into a single `usage` map keyed by hostname. `matchTracked()` returns the host if it's either kind; `evaluateTab` only redirects when the host is in `settings.domains` (distracting), so task domains accumulate time but never get blocked.

**Service worker (`background.js`)** — Event-driven, not polled.
- Tracks one global `activeDomain` + `lastTickTs`. `commitElapsed()` flushes accrued seconds to `usage[activeDomain]` on every relevant event (tab activated, tab updated, window focus changed, alarm tick). There is no `setInterval` — service workers can be terminated.
- The 30s `tick` alarm is a heartbeat for mid-session limit enforcement, **not** the time accounting mechanism. Time still accrues correctly across SW restarts because each event recomputes `now - lastTickTs`.
- `evaluateTab(tab)` is the policy decision point. Three independent block triggers, in order: (1) path rule → `reason=path`; (2) target domain + gating fails → `reason=tasks`; (3) target domain + over limit → `reason=limit`. Each redirects via `chrome.tabs.update` to `block.html?reason=...&domain=...`.
- **Loop prevention**: `isBlockPage()` early-returns in `evaluateTab` so the block page never redirects itself.
- **SPA navigation**: YouTube/Instagram use `history.pushState`, which does *not* fire `onBeforeNavigate` or `onUpdated`. `webNavigation.onHistoryStateUpdated` is the only listener that catches `/watch` → `/shorts`.
- **Daily reset**: dual-pathed — `dailyReset` alarm at next midnight, plus the lazy roll inside `getState()` that handles machine-sleep-over-midnight.

**Message protocol** — popup, options, and block page all call `chrome.runtime.sendMessage` with one of: `getStatus`, `saveSettings`, `resetUsage`. After any mutation, the background re-runs `evaluateAllTabs()` so newly-allowed tabs aren't redirected and newly-blocked ones are. UI does not write to `chrome.storage` directly — route mutations through messages so this re-evaluation always runs.

**Host permissions** — `<all_urls>` because the domain list is user-configurable. If you tighten this, the options-page domain editor must also gate on `chrome.permissions.request`.

## Conventions

- ES modules everywhere (`"type": "module"` in manifest, `<script type="module">` in HTML pages). Don't add `importScripts` — it's incompatible with module workers.
- Keep all DOM access in the per-page `*.js` files; `storage.js` stays browser-neutral so it can be imported anywhere.
- Time is stored as **seconds** (integer) in `usage`; the options page exposes minutes for the daily limit and converts on save. Don't mix units.
- Block-page URL params (`reason`, `domain`) are the contract between background and block.js — keep them in sync if you add new block reasons.
