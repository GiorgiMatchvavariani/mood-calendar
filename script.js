// ---------- DOM ----------
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const emojiModal = document.getElementById("emojiModal");
const emojiOptions = document.querySelectorAll(".emoji-options span");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");
const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const setTokenBtn = document.getElementById("setTokenBtn");
const clearTokenBtn = document.getElementById("clearTokenBtn");
const saveCloudBtn = document.getElementById("saveCloudBtn");
const cloudStatus = document.getElementById("cloudStatus");

// ---------- Config ----------
const GITHUB_USER = "GiorgiMatchvavariani";
const REPO = "mood-calendar";
const BRANCH = "main";
const FILE_PATH = "moods.json";

// ---------- State ----------
let currentDate = new Date();
let selectedDay = null;
let moodData = {};
let saveInFlight = false;

// ---------- Helpers ----------
const moodColors = {
  "😄": "#8BC34A", // Great (green)
  "🙂": "#C5E1A5", // Good (light green)
  "😐": "#FFF176", // Meh (yellow)
  "😕": "#FFB74D", // Bad (orange)
  "😠": "#E57373"  // Terrible (red)
};

function encodeBase64Unicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function decodeBase64Unicode(b64) {
  return decodeURIComponent(escape(atob(b64)));
}
function setStatus(text) { cloudStatus.textContent = `Cloud: ${text}`; }
function getToken() { return localStorage.getItem("ghToken") || ""; }
function setTokenInteractive() {
  const t = prompt("Paste your GitHub Fine-Grained Token (repo contents: read+write):");
  if (t && t.trim()) {
    localStorage.setItem("ghToken", t.trim());
    setStatus("Token saved");
  }
}
function clearToken() { localStorage.removeItem("ghToken"); setStatus("Not connected"); }

// ---------- GitHub API ----------
async function getFileMeta() {
  const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const headers = { Accept: "application/vnd.github+json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (res.status === 404) return { exists: false };
  if (!res.ok) throw new Error(`GitHub getFileMeta failed: ${res.status}`);
  const json = await res.json();
  return { exists: true, sha: json.sha, content: json.content };
}

async function loadFromGitHub() {
  try {
    setStatus("Loading…");
    // Try public raw first (works without token if repo is public)
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO}/${BRANCH}/${FILE_PATH}`;
    let res = await fetch(rawUrl);
    if (res.ok) {
      moodData = await res.json();
      setStatus("Loaded");
      return;
    }
    // Fallback to API (private repo with token)
    const meta = await getFileMeta();
    if (!meta.exists) { moodData = {}; setStatus("File not found (will create)"); return; }
    const raw = meta.content.replace(/\n/g, "");
    const text = decodeBase64Unicode(raw);
    moodData = JSON.parse(text);
    setStatus("Loaded");
  } catch (e) {
    console.warn(e);
    setStatus("Load failed (using local data)");
  }
}

async function saveToGitHub() {
  const token = getToken();
  if (!token) { setStatus("No token — local only"); return; }
  if (saveInFlight) return;
  saveInFlight = true;
  setStatus("Saving…");
  try {
    let sha;
    try {
      const meta = await getFileMeta();
      if (meta.exists) sha = meta.sha;
    } catch(_) {}

    const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO}/contents/${FILE_PATH}`;
    const body = {
      message: "Update moods.json",
      content: encodeBase64Unicode(JSON.stringify(moodData, null, 2)),
      branch: BRANCH
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`GitHub save failed: ${res.status} ${await res.text()}`);
    setStatus("Saved");
  } catch (e) {
    console.warn(e);
    setStatus("Save failed");
  } finally {
    saveInFlight = false;
  }
}

// ---------- UI: selectors ----------
function populateSelectors() {
  for (let i = 0; i < 12; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.text = new Date(2000, i).toLocaleString("default", { month: "long" });
    monthSelect.appendChild(opt);
  }
  const thisYear = new Date().getFullYear();
  for (let y = thisYear - 50; y <= thisYear + 50; y++) {
    const opt = document.createElement("option");
    opt.value = y; opt.text = y; yearSelect.appendChild(opt);
  }
}
function updateSelectors() {
  monthSelect.value = currentDate.getMonth();
  yearSelect.value = currentDate.getFullYear();
}

// ---------- Calendar ----------
function generateCalendar(year, month) {
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  monthYear.textContent = new Date(year, month).toLocaleString("default", {
    month: "long", year: "numeric"
  });

  calendar.innerHTML = "";
  for (let i = 0; i < firstDay; i++) calendar.appendChild(document.createElement("div"));

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.classList.add("day");
    cell.dataset.day = day;
    cell.innerHTML = `${day}`;

    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      cell.classList.add("today");
    }

    const key = `mood-${year}-${month}-${day}`;
    const savedEmoji = moodData[key];
    if (savedEmoji) {
      const emojiSpan = document.createElement("span");
      emojiSpan.classList.add("emoji");
      emojiSpan.textContent = savedEmoji;
      cell.appendChild(emojiSpan);
      if (moodColors[savedEmoji]) cell.style.backgroundColor = moodColors[savedEmoji];
    }

    cell.addEventListener("click", () => {
      selectedDay = { year, month, day };
      emojiModal.classList.remove("hidden");
    });

    calendar.appendChild(cell);
  }
}

// ---------- Emoji selection ----------
emojiOptions.forEach(option => {
  option.addEventListener("click", async () => {
    const emoji = option.dataset.emoji;
    const { year, month, day } = selectedDay;
    const key = `mood-${year}-${month}-${day}`;
    if (emoji === "") delete moodData[key];
    else moodData[key] = emoji;

    // Save locally (fast)
    localStorage.setItem("moodData", JSON.stringify(moodData));

    generateCalendar(year, month);
    emojiModal.classList.add("hidden");
  });
});

// ---------- Navigation ----------
prevBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateSelectors();
  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
});
nextBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateSelectors();
  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
});
monthSelect.addEventListener("change", () => {
  currentDate.setMonth(parseInt(monthSelect.value));
  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
});
yearSelect.addEventListener("change", () => {
  currentDate.setFullYear(parseInt(yearSelect.value));
  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
});

// ---------- Token buttons ----------
setTokenBtn.addEventListener("click", setTokenInteractive);
clearTokenBtn.addEventListener("click", clearToken);
saveCloudBtn.addEventListener("click", saveToGitHub);

// ---------- Init ----------
async function init() {
  // Load local cache first
  const savedData = localStorage.getItem("moodData");
  if (savedData) { try { moodData = JSON.parse(savedData); } catch { moodData = {}; } }

  populateSelectors();
  updateSelectors();
  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());

  // Load canonical copy from GitHub (if public or if token present)
  await loadFromGitHub();

  // If GitHub returned empty but local had data, keep local copy visible
  if (Object.keys(moodData || {}).length === 0 && savedData) {
    try { moodData = JSON.parse(savedData); } catch {}
  }

  generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
}
init();
