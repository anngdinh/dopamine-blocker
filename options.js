const $ = (id) => document.getElementById(id);

function parsePaths(text) {
  const rules = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const [domain, ...rest] = parts;
    const path = rest.join(" ");
    if (!path.startsWith("/")) continue;
    rules.push({ domain: domain.toLowerCase(), path });
  }
  return rules;
}

function formatPaths(rules) {
  return (rules || []).map((r) => `${r.domain} ${r.path}`).join("\n");
}

function parseDomains(text) {
  return text
    .split("\n")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function load() {
  const res = await chrome.runtime.sendMessage({ type: "getStatus" });
  if (!res?.ok) return;
  const s = res.state.settings;
  $("dailyLimit").value = Math.round((s.dailyLimit || 900) / 60);
  $("gatingEnabled").checked = !!s.gatingEnabled;
  $("domains").value = (s.domains || []).join("\n");
  $("paths").value = formatPaths(s.blockedPaths);
}

async function save() {
  const minutes = parseInt($("dailyLimit").value, 10);
  const settings = {
    dailyLimit: Math.max(60, (isFinite(minutes) ? minutes : 15) * 60),
    gatingEnabled: $("gatingEnabled").checked,
    domains: parseDomains($("domains").value),
    blockedPaths: parsePaths($("paths").value)
  };
  const res = await chrome.runtime.sendMessage({ type: "saveSettings", settings });
  $("msg").textContent = res?.ok ? "Saved." : "Save failed.";
  setTimeout(() => { $("msg").textContent = ""; }, 1500);
}

$("save").addEventListener("click", save);
load();
