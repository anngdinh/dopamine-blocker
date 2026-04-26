# Dopamine Blocker

Chromium browser extension (MV3) that limits time on distracting sites and gates access on completing daily tasks.

## Features

- **Domain blocking** — youtube.com, facebook.com, instagram.com (configurable)
- **Path blocking** — `/shorts`, `/reels` (configurable, always blocked)
- **Per-domain daily limit** — each blocked domain has its own minute cap (default 15m); only counts when tab is active and window is focused
- **Task gating** — configurable list of task domains (default: `leetcode.com` 5m, `www.study4.com` 5m); every task's required time must be met before any blocked domain unlocks (empty the list to disable)
- **Daily reset** — usage resets at local midnight
- **Local-only** — no network, no telemetry; uses `chrome.storage.local`

## Install (unpacked)

1. Open `brave://extensions` (or `chrome://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Pin the extension; click the icon to open the popup.

## Usage

- **Popup** — toggle today's tasks, view per-domain usage, reset usage.
- **Settings** — edit daily limit (minutes), domains, path rules, and gating toggle.
- **Block page** — appears when access is denied; shows reason, used/remaining time, task state.

## File layout

```text
manifest.json     MV3 manifest
background.js     Service worker — tracking, gating, redirect logic
storage.js        Shared state helpers
popup.html/js/css Toolbar popup
options.html/js/css  Settings page
block.html/js/css Block page
```

## Notes

- Time tracking uses focus events plus a 30s alarm tick; service-worker minimum alarm period is 30s.
- Path blocks fire on SPA navigation (e.g. YouTube `pushState` to `/shorts`) via `webNavigation.onHistoryStateUpdated`.
- v1 has no anti-bypass guarantees — disabling the extension disables enforcement.
