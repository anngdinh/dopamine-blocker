# Privacy Policy — Dopamine Blocker

**Effective:** 2026-04-26

Dopamine Blocker is a personal-productivity browser extension. It is designed
to operate entirely on-device.

## Data we collect

**None that leaves your computer.**

The extension stores the following locally via `chrome.storage.local`:

- Per-domain active-tab seconds for the current day (e.g. `www.youtube.com → 312`)
- Your configured blocked domains, blocked path prefixes, and task list
- The current local date (used to roll usage at midnight)

This data never leaves the browser. No analytics, no telemetry, no remote
endpoints, no advertising identifiers.

## Network access

The extension makes no outbound network requests. It does not use
`fetch()`, `XMLHttpRequest`, WebSocket, or any other network API.

## Permissions used and why

- `storage` — persist settings and per-day usage counters locally.
- `tabs` — read the active tab's URL to identify the current domain and
  redirect it when blocked.
- `alarms` — schedule a 30-second time-tracking heartbeat and a daily
  midnight reset.
- `webNavigation` — detect SPA history navigation (e.g. YouTube
  `pushState` to `/shorts`) so path rules apply to in-page transitions.
- `<all_urls>` host permission — required so the user-configurable
  blocked-domain list can match any host the user adds. The extension
  does not read page contents; it only inspects the URL.

## Third parties

The extension uses no third-party services, libraries, fonts, or analytics.

## Data retention and deletion

All data lives in your browser's local extension storage. To delete:

- Click **Reset usage** in the popup to clear today's usage, OR
- Remove the extension from `brave://extensions` / `chrome://extensions`
  to delete all stored data, OR
- Clear extension storage manually via the service-worker DevTools console:
  `chrome.storage.local.clear()`

## Changes

This document will be updated in the same Git repository if the data
practices ever change.

## Contact

Questions or concerns: open an issue on the project repository.
