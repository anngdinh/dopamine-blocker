import {
  getState,
  saveState,
  matchDomain,
  matchTracked,
  isPathBlocked,
  allTasksComplete
} from "./storage.js";

let activeDomain = null;
let activeTabId = null;
let activeWindowFocused = true;
let lastTickTs = Date.now();

function blockUrl(reason, domain) {
  return chrome.runtime.getURL(
    `block.html?reason=${encodeURIComponent(reason)}&domain=${encodeURIComponent(domain || "")}`
  );
}

function isBlockPage(url) {
  return typeof url === "string" && url.startsWith(chrome.runtime.getURL("block.html"));
}

async function commitElapsed() {
  const now = Date.now();
  const elapsedMs = now - lastTickTs;
  lastTickTs = now;
  if (!activeDomain || !activeWindowFocused) return null;
  const elapsed = Math.floor(elapsedMs / 1000);
  if (elapsed <= 0) return null;
  const state = await getState();
  state.usage[activeDomain] = (state.usage[activeDomain] || 0) + elapsed;
  await saveState(state);
  return state;
}

async function evaluateTab(tab) {
  if (!tab || !tab.id || !tab.url) return;
  if (isBlockPage(tab.url)) return;
  let url;
  try { url = new URL(tab.url); } catch { return; }
  if (!["http:", "https:"].includes(url.protocol)) return;

  const state = await getState();
  const { settings, usage } = state;

  const pathRule = isPathBlocked(url.hostname, url.pathname, settings.blockedPaths);
  if (pathRule) {
    await redirect(tab.id, blockUrl("path", pathRule.domain));
    return;
  }

  const rule = matchDomain(url.hostname, settings.domains);
  if (!rule) return;

  if (!allTasksComplete(settings, usage)) {
    await redirect(tab.id, blockUrl("tasks", rule.domain));
    return;
  }

  const used = usage[rule.domain] || 0;
  const limit = (rule.limitMinutes || 0) * 60;
  if (limit > 0 && used >= limit) {
    await redirect(tab.id, blockUrl("limit", rule.domain));
  }
}

async function redirect(tabId, url) {
  try { await chrome.tabs.update(tabId, { url }); } catch (_) {}
}

async function evaluateAllTabs() {
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) await evaluateTab(t);
}

async function refreshActive() {
  const state = await commitElapsed();

  let focused = false;
  try {
    const win = await chrome.windows.getLastFocused({ populate: false });
    focused = !!(win && win.focused);
  } catch (_) {}
  activeWindowFocused = focused;

  if (!focused) {
    activeDomain = null;
    activeTabId = null;
    return;
  }

  let tab = null;
  try {
    const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    tab = t || null;
  } catch (_) {}

  if (!tab || !tab.url) {
    activeDomain = null;
    activeTabId = null;
    return;
  }

  let host = "";
  try { host = new URL(tab.url).hostname; } catch (_) {}
  const s = state || (await getState());
  activeDomain = matchTracked(host, s.settings);
  activeTabId = tab.id;

  await evaluateTab(tab);
}

chrome.tabs.onActivated.addListener(() => { refreshActive(); });
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.url || info.status === "loading") {
    evaluateTab(tab).then(() => {
      if (tab.active) refreshActive();
    });
  }
});
chrome.windows.onFocusChanged.addListener(() => { refreshActive(); });
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  await evaluateTab({ id: details.tabId, url: details.url });
});
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const tab = await chrome.tabs.get(details.tabId).catch(() => null);
  if (tab) await evaluateTab(tab);
});

function nextMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

async function setupAlarms() {
  await chrome.alarms.create("tick", { periodInMinutes: 0.5 });
  await chrome.alarms.create("dailyReset", {
    when: nextMidnight(),
    periodInMinutes: 24 * 60
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  await getState();
  await setupAlarms();
});
chrome.runtime.onStartup.addListener(async () => {
  await getState();
  await setupAlarms();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tick") {
    await refreshActive();
  } else if (alarm.name === "dailyReset") {
    await getState();
    await evaluateAllTabs();
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "getStatus") {
        const state = await getState();
        sendResponse({ ok: true, state });
      } else if (msg?.type === "saveSettings") {
        const state = await getState();
        state.settings = { ...state.settings, ...(msg.settings || {}) };
        await saveState(state);
        await evaluateAllTabs();
        sendResponse({ ok: true, state });
      } else if (msg?.type === "resetUsage") {
        const state = await getState();
        state.usage = {};
        await saveState(state);
        await evaluateAllTabs();
        sendResponse({ ok: true, state });
      } else {
        sendResponse({ ok: false, error: "unknown message" });
      }
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  return true;
});
