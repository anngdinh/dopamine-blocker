import { fmtSeconds, taskComplete } from "./storage.js";

const $ = (id) => document.getElementById(id);

async function send(msg) {
  return await chrome.runtime.sendMessage(msg);
}

function row({ label, used, target, cls }) {
  const li = document.createElement("li");
  if (cls) li.className = cls;
  li.title = target > 0 ? `${fmtSeconds(used)} / ${fmtSeconds(target)}` : fmtSeconds(used);
  const name = document.createElement("span");
  name.className = "domain";
  name.textContent = label;
  const bar = document.createElement("div");
  bar.className = "bar";
  const fill = document.createElement("div");
  fill.className = "fill";
  const pct = target > 0 ? Math.min(100, Math.max(0, (used / target) * 100)) : 0;
  fill.style.width = `${pct}%`;
  bar.append(fill);
  li.append(name, bar);
  return li;
}

async function render() {
  const res = await send({ type: "getStatus" });
  if (!res?.ok) return;
  const { state } = res;

  $("date").textContent = state.date;

  const taskList = $("taskList");
  taskList.innerHTML = "";
  for (const t of state.settings.tasks) {
    const used = state.usage[t.domain] || 0;
    const need = t.requiredMinutes * 60;
    const done = taskComplete(t, state.usage);
    taskList.append(row({
      label: `${done ? "✓" : "○"} ${t.id}`,
      used,
      target: need,
      cls: done ? "done" : ""
    }));
  }

  const usageList = $("usageList");
  usageList.innerHTML = "";
  for (const d of state.settings.domains) {
    const used = state.usage[d.domain] || 0;
    const limit = (d.limitMinutes || 0) * 60;
    usageList.append(row({
      label: d.domain,
      used,
      target: limit,
      cls: limit > 0 && used >= limit ? "over" : ""
    }));
  }
}

$("resetUsage").addEventListener("click", async () => {
  await send({ type: "resetUsage" });
  render();
});
$("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

render();
setInterval(render, 1000);
