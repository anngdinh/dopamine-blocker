import { fmtSeconds, taskComplete } from "./storage.js";

const $ = (id) => document.getElementById(id);

async function send(msg) {
  return await chrome.runtime.sendMessage(msg);
}

function row(label, value, opts = {}) {
  const li = document.createElement("li");
  if (opts.cls) li.className = opts.cls;
  const a = document.createElement("span");
  a.className = "domain";
  a.textContent = label;
  const b = document.createElement("span");
  b.className = "usage";
  b.textContent = value;
  li.append(a, b);
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
    taskList.append(row(
      `${done ? "✓" : "○"} ${t.id}`,
      done ? `${fmtSeconds(need)} ✓` : `${fmtSeconds(used)} / ${fmtSeconds(need)}`,
      { cls: done ? "done" : "" }
    ));
  }

  const usageList = $("usageList");
  usageList.innerHTML = "";
  for (const d of state.settings.domains) {
    const used = state.usage[d.domain] || 0;
    const limit = (d.limitMinutes || 0) * 60;
    usageList.append(row(
      d.domain,
      `${fmtSeconds(used)} / ${fmtSeconds(limit)}`,
      { cls: limit > 0 && used >= limit ? "over" : "" }
    ));
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
