# Chrome Web Store listing — Dopamine Blocker

Drop-in copy for the CWS developer dashboard fields. Edit before
submission to match your final username, repo URL, and contact info.

---

## Short description (≤132 chars)

```text
Block distracting sites with per-domain time limits and a "finish
your tasks first" gate. 100% local — no telemetry.
```

(127 chars.)

## Detailed description

```text
Dopamine Blocker keeps you from doomscrolling without resorting to
hard-mode willpower.

What it does
- Always-block specific paths like /shorts, /reels, and Facebook
  /reel so brain-rot feeds never load.
- Per-domain daily time limit (e.g. 15 minutes/day on YouTube).
  Counts only when the tab is active and the window is focused.
- Task gating — configure your own list of "earn-it" domains
  (default: leetcode.com, www.study4.com). You can't open the
  blocked sites until you've spent the required active time on
  each task domain today.
- Daily reset at local midnight.

What it does NOT do
- No network requests. Nothing leaves your computer — ever.
- No analytics, no telemetry, no third-party scripts.
- No reading of page contents — only the URL is inspected for
  blocking decisions.

Configure everything in the Options page: blocked domains, blocked
path prefixes, and tasks (with their required minutes).

Built as a Manifest V3 extension. Works on Chromium-based browsers
including Google Chrome and Brave.
```

## Single-purpose justification

```text
Dopamine Blocker has one purpose: limit and gate the user's access
to a configurable set of distracting websites. Every permission and
every line of code exists to track active-tab time on those domains
and redirect navigation to a local block page when limits or task
requirements aren't met. The extension does not bundle unrelated
features, content, or services.
```

## Permissions justification

| Permission | Why it's required |
| --- | --- |
| `storage` | Save the user's settings (blocked domains, paths, tasks) and per-day usage counters locally via `chrome.storage.local`. No remote storage. |
| `tabs` | Read the active tab's URL to determine the current domain, and call `chrome.tabs.update` to redirect a blocked tab to the local block page. |
| `alarms` | Drive a 30-second heartbeat that flushes accrued active-tab time, plus a one-shot midnight alarm that resets daily counters. |
| `webNavigation` | Catch in-page SPA history changes (e.g. YouTube `pushState` to `/shorts`); without this, path rules wouldn't fire on internal navigation. |
| `host_permissions: <all_urls>` | The blocked-domain list is fully user-configurable — the user can add any host they choose. The extension never reads page contents; it only inspects URLs of the active tab and incoming navigations. |

## Privacy policy URL

Link to a publicly hosted copy of `PRIVACY.md` from this repository.
GitHub Pages or the raw file URL on `main` is acceptable, e.g.

```text
https://github.com/<your-user>/dopamine-blocker/blob/main/PRIVACY.md
```

## Promo tile

`assets/promo-tile.png` — 440×280, generated from `assets/promo-tile.svg`.

## Screenshots

`assets/screenshot.png` — 1280×800, generated from `assets/screenshot.svg`.

Note: Chrome Web Store reviewers prefer **real screenshots** of the
running extension. Replace `assets/screenshot.png` with a captured
screenshot of the actual block page or popup before final submission.

## Category

Productivity

## Build / regenerate assets

```sh
rsvg-convert -w 16  -h 16  assets/icon.svg       -o icons/icon16.png
rsvg-convert -w 48  -h 48  assets/icon.svg       -o icons/icon48.png
rsvg-convert -w 128 -h 128 assets/icon.svg       -o icons/icon128.png
rsvg-convert -w 440 -h 280 assets/promo-tile.svg -o assets/promo-tile.png
rsvg-convert -w 1280 -h 800 assets/screenshot.svg -o assets/screenshot.png
```

## Submission package

When you're ready to upload to the developer dashboard, zip only the
files the extension actually loads at runtime:

```sh
zip -r dopamine-blocker.zip \
  manifest.json background.js storage.js \
  popup.html popup.js popup.css \
  options.html options.js options.css \
  block.html block.js block.css \
  icons/
```

Exclude `.git/`, `assets/`, `STORE.md`, `PRIVACY.md`, `CLAUDE.md`,
and `README.md` — none are referenced by the manifest.
