import { fmtSeconds } from "./storage.js";

const params = new URLSearchParams(location.search);
const reason = params.get("reason") || "blocked";
const domain = params.get("domain") || "";

const REASON_TEXT = {
  limit: "Daily limit exceeded for this site.",
  tasks: "Daily tasks not yet completed.",
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
  document.getElementById("study4").textContent = state.tasks.study4Completed ? "✓ done" : "✗ pending";
  document.getElementById("leetcode").textContent = state.tasks.leetcodeCompleted ? "✓ done" : "✗ pending";
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
