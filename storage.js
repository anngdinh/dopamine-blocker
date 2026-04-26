export const DEFAULTS = {
  usage: {},
  tasks: { study4Completed: false, leetcodeCompleted: false },
  settings: {
    dailyLimit: 900,
    domains: ["www.youtube.com", "www.facebook.com", "www.instagram.com"],
    blockedPaths: [
      { domain: "www.youtube.com", path: "/shorts" },
      { domain: "www.instagram.com", path: "/reels" },
      { domain: "www.facebook.com", path: "/reel" }
    ],
    gatingEnabled: true
  },
  date: ""
};

export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getState() {
  const data = await chrome.storage.local.get(null);
  const state = {
    usage: data.usage || {},
    tasks: { ...DEFAULTS.tasks, ...(data.tasks || {}) },
    settings: { ...DEFAULTS.settings, ...(data.settings || {}) },
    date: data.date || ""
  };
  return rollDate(state);
}

export async function saveState(state) {
  await chrome.storage.local.set({
    usage: state.usage,
    tasks: state.tasks,
    settings: state.settings,
    date: state.date
  });
}

async function rollDate(state) {
  const today = todayStr();
  if (state.date !== today) {
    state.date = today;
    state.usage = {};
    state.tasks = { study4Completed: false, leetcodeCompleted: false };
    await saveState(state);
  }
  return state;
}

export function matchDomain(host, domains) {
  if (!host) return null;
  const h = host.toLowerCase();
  for (const d of domains) {
    if (h === d.toLowerCase()) return h;
  }
  return null;
}

export function isPathBlocked(host, pathname, blockedPaths) {
  if (!host) return null;
  const h = host.toLowerCase();
  for (const rule of blockedPaths || []) {
    if (h === (rule.domain || "").toLowerCase() && pathname.startsWith(rule.path)) {
      return rule;
    }
  }
  return null;
}

export function fmtSeconds(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
