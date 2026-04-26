import { fmtSeconds, taskComplete, allTasksComplete } from "./storage.js";

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

  const gated = state.settings.gatingEnabled && !allTasksComplete(state.settings, state.usage);
  $("gatingHint").textContent = gated
    ? "Spend the required time on each task domain to unlock target sites."
    : (state.settings.gatingEnabled ? "Tasks complete — daily limit applies." : "Gating disabled.");

  const usageList = $("usageList");
  usageList.innerHTML = "";
  const limit = state.settings.dailyLimit;
  for (const domain of state.settings.domains) {
    const used = state.usage[domain] || 0;
    usageList.append(row(
      domain,
      `${fmtSeconds(used)} / ${fmtSeconds(limit)}`,
      { cls: used >= limit ? "over" : "" }
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
