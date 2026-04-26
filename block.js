import { fmtSeconds, taskComplete } from "./storage.js";

const params = new URLSearchParams(location.search);
const reason = params.get("reason") || "blocked";
const domain = params.get("domain") || "";

const REASON_TEXT = {
  limit: "Daily limit exceeded for this site.",
  path: "This path is on the always-blocked list."
};

document.getElementById("reason").textContent = REASON_TEXT[reason] || "Access blocked.";
document.getElementById("domain").textContent = domain || "—";

async function refresh() {
  const res = await chrome.runtime.sendMessage({ type: "getStatus" });
  if (!res?.ok) return;
  const { state } = res;
  const limit = state.settings.dailyLimit;
  const used = state.usage[domain] || 0;
  const remaining = Math.max(0, limit - used);

  document.getElementById("used").textContent = fmtSeconds(used);
  document.getElementById("remaining").textContent = fmtSeconds(remaining);

  const list = document.getElementById("taskList");
  list.innerHTML = "";
  for (const t of state.settings.tasks) {
    const li = document.createElement("li");
    const done = taskComplete(t, state.usage);
    const tUsed = state.usage[t.domain] || 0;
    const need = t.requiredMinutes * 60;
    li.innerHTML = `${t.id} <span>${done ? "✓ " + fmtSeconds(need) : fmtSeconds(tUsed) + " / " + fmtSeconds(need)}</span>`;
    list.append(li);
  }
}

document.getElementById("goBack").addEventListener("click", () => {
  if (history.length > 1) history.back();
  else location.href = "about:blank";
});
document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

refresh();
setInterval(refresh, 1000);
