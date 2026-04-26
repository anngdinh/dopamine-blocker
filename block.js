import { fmtSeconds, taskComplete } from "./storage.js";

const params = new URLSearchParams(location.search);
const reason = params.get("reason") || "blocked";
const domain = params.get("domain") || "";

const REASON_TEXT = {
  limit: "Daily limit exceeded for this site.",
  tasks: "Finish all tasks before accessing this site.",
  path: "This path is on the always-blocked list."
};

const TITLES = {
  limit: "Time's up.",
  tasks: "Hold up.",
  path: "Brain-rot detected."
};

const EMOJI = {
  limit: "⏰",
  tasks: "📚",
  path: "🧠"
};

const TAUNTS = {
  tasks: [
    "No work, no scrollin'. The grind awaits.",
    "Bro. Your leetcode problem is staring at you.",
    "Touch grass. Or at least touch your IDE first.",
    "POV: your future self is begging you to lock in.",
    "Distraction.exe has stopped working — finish the task and try again.",
    "We are NOT letting you cook something stupid right now."
  ],
  limit: [
    "You used up all your dopamine for today. Try again tomorrow.",
    "That's enough doomscrolling, friend. Go outside.",
    "Daily ration of brain-rot: depleted. ✓",
    "Closing time. You don't have to go home but you can't scroll here.",
    "Achievement unlocked: gave the brain a break."
  ],
  path: [
    "Shorts and Reels are forever banned in this house. You're welcome.",
    "Brain-rot pipeline detected and severed. ✂️",
    "Long-form content only. We're trying to grow neurons here.",
    "Imagine watching a 15-second video. Couldn't be us."
  ]
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

document.getElementById("title").textContent = TITLES[reason] || "Blocked";
document.getElementById("emoji").textContent = EMOJI[reason] || "🚫";
document.getElementById("reason").textContent = REASON_TEXT[reason] || "Access blocked.";
document.getElementById("taunt").textContent = pick(TAUNTS[reason] || ["Stay focused."]);
document.getElementById("domain").textContent = domain || "—";

async function refresh() {
  const res = await chrome.runtime.sendMessage({ type: "getStatus" });
  if (!res?.ok) return;
  const { state } = res;
  const rule = state.settings.domains.find((d) => d.domain === domain);
  const limit = rule ? (rule.limitMinutes || 0) * 60 : 0;
  const used = state.usage[domain] || 0;
  const remaining = Math.max(0, limit - used);

  document.getElementById("used").textContent = fmtSeconds(used);
  document.getElementById("remaining").textContent = limit > 0 ? fmtSeconds(remaining) : "—";

  const list = document.getElementById("taskList");
  list.innerHTML = "";
  for (const t of state.settings.tasks) {
    const li = document.createElement("li");
    const done = taskComplete(t, state.usage);
    const tUsed = state.usage[t.domain] || 0;
    const need = t.requiredMinutes * 60;

    const label = document.createElement(done ? "span" : "a");
    label.textContent = t.id;
    if (!done) {
      label.href = `https://${t.domain}/`;
      label.className = "task-link";
      label.title = `Open ${t.domain} to work on this task`;
    }

    const value = document.createElement("span");
    value.textContent = done
      ? `✓ ${fmtSeconds(need)}`
      : `${fmtSeconds(tUsed)} / ${fmtSeconds(need)}`;

    li.append(label, value);
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
