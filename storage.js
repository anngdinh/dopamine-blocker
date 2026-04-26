export const DEFAULTS = {
  usage: {},
  settings: {
    domains: [
      { domain: "www.youtube.com", limitMinutes: 15 },
      { domain: "www.facebook.com", limitMinutes: 15 },
      { domain: "www.instagram.com", limitMinutes: 15 }
    ],
    blockedPaths: [
      { domain: "www.youtube.com", path: "/shorts" },
      { domain: "www.instagram.com", path: "/reels" },
      { domain: "www.facebook.com", path: "/reel" }
    ],
    tasks: [
      { id: "leetcode", domain: "leetcode.com", requiredMinutes: 5 },
      { id: "study4", domain: "www.study4.com", requiredMinutes: 5 }
    ]
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
  const stored = data.settings || {};
  const settings = { ...DEFAULTS.settings, ...stored };
  if (Array.isArray(settings.domains) && settings.domains.some((d) => typeof d === "string")) {
    const fallbackMin = Math.round((stored.dailyLimit || 900) / 60);
    settings.domains = settings.domains.map((d) =>
      typeof d === "string" ? { domain: d, limitMinutes: fallbackMin } : d
    );
  }
  delete settings.dailyLimit;
  const state = {
    usage: data.usage || {},
    settings,
    date: data.date || ""
  };
  return rollDate(state);
}

export async function saveState(state) {
  await chrome.storage.local.set({
    usage: state.usage,
    settings: state.settings,
    date: state.date
  });
}

async function rollDate(state) {
  const today = todayStr();
  if (state.date !== today) {
    state.date = today;
    state.usage = {};
    await saveState(state);
  }
  return state;
}

export function matchDomain(host, domains) {
  if (!host) return null;
  const h = host.toLowerCase();
  for (const d of domains || []) {
    if (h === (d.domain || "").toLowerCase()) return d;
  }
  return null;
}

export function findTask(host, tasks) {
  if (!host) return null;
  const h = host.toLowerCase();
  for (const t of tasks || []) {
    if (h === (t.domain || "").toLowerCase()) return t;
  }
  return null;
}

export function matchTracked(host, settings) {
  if (matchDomain(host, settings.domains)) return host.toLowerCase();
  if (findTask(host, settings.tasks)) return host.toLowerCase();
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

export function taskComplete(task, usage) {
  const need = (task.requiredMinutes || 0) * 60;
  return (usage[task.domain] || 0) >= need;
}

export function allTasksComplete(settings, usage) {
  const tasks = settings.tasks || [];
  if (tasks.length === 0) return true;
  return tasks.every((t) => taskComplete(t, usage));
}

export function fmtSeconds(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
