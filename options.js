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
  const out = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const [domain, minStr] = parts;
    const minutes = parseInt(minStr, 10);
    if (!isFinite(minutes) || minutes < 0) continue;
    out.push({ domain: domain.toLowerCase(), limitMinutes: minutes });
  }
  return out;
}

function formatDomains(rules) {
  return (rules || []).map((d) => `${d.domain} ${d.limitMinutes}`).join("\n");
}

function parseTasks(text) {
  const tasks = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 3) continue;
    const [id, domain, minStr] = parts;
    const minutes = parseInt(minStr, 10);
    if (!isFinite(minutes) || minutes < 0) continue;
    tasks.push({
      id: id.toLowerCase(),
      domain: domain.toLowerCase(),
      requiredMinutes: minutes
    });
  }
  return tasks;
}

function formatTasks(tasks) {
  return (tasks || []).map((t) => `${t.id} ${t.domain} ${t.requiredMinutes}`).join("\n");
}

async function load() {
  const res = await chrome.runtime.sendMessage({ type: "getStatus" });
  if (!res?.ok) return;
  const s = res.state.settings;
  $("domains").value = formatDomains(s.domains);
  $("paths").value = formatPaths(s.blockedPaths);
  $("tasks").value = formatTasks(s.tasks);
}

async function save() {
  const settings = {
    domains: parseDomains($("domains").value),
    blockedPaths: parsePaths($("paths").value),
    tasks: parseTasks($("tasks").value)
  };
  const res = await chrome.runtime.sendMessage({ type: "saveSettings", settings });
  $("msg").textContent = res?.ok ? "Saved." : "Save failed.";
  setTimeout(() => { $("msg").textContent = ""; }, 1500);
}

$("save").addEventListener("click", save);
load();
