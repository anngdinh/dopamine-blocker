import { fmtSeconds } from "./storage.js";

const $ = (id) => document.getElementById(id);

async function send(msg) {
  return await chrome.runtime.sendMessage(msg);
}

async function render() {
  const res = await send({ type: "getStatus" });
  if (!res?.ok) return;
  const { state } = res;

  $("date").textContent = state.date;
  $("study4").checked = !!state.tasks.study4Completed;
  $("leetcode").checked = !!state.tasks.leetcodeCompleted;

  const gated = state.settings.gatingEnabled &&
    !(state.tasks.study4Completed && state.tasks.leetcodeCompleted);
  $("gatingHint").textContent = gated
    ? "Both tasks must be done before target sites unlock."
    : (state.settings.gatingEnabled ? "Tasks complete — daily limit applies." : "Gating disabled.");

  const list = $("usageList");
  list.innerHTML = "";
  const limit = state.settings.dailyLimit;
  for (const domain of state.settings.domains) {
    const used = state.usage[domain] || 0;
    const li = document.createElement("li");
    if (used >= limit) li.classList.add("over");
    const dn = document.createElement("span");
    dn.className = "domain";
    dn.textContent = domain;
    const us = document.createElement("span");
    us.className = "usage";
    us.textContent = `${fmtSeconds(used)} / ${fmtSeconds(limit)}`;
    li.append(dn, us);
    list.append(li);
  }
}

$("study4").addEventListener("change", async (e) => {
  await send({ type: "setTask", task: "study4Completed", value: e.target.checked });
  render();
});
$("leetcode").addEventListener("change", async (e) => {
  await send({ type: "setTask", task: "leetcodeCompleted", value: e.target.checked });
  render();
});
$("resetUsage").addEventListener("click", async () => {
  await send({ type: "resetUsage" });
  render();
});
$("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

render();
setInterval(render, 1000);
