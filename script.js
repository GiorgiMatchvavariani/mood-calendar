const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const emojiModal = document.getElementById("emojiModal");
const emojiOptions = document.querySelectorAll(".emoji-options span");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");
const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const saveBtn = document.getElementById("saveBtn");

let currentDate = new Date();
let selectedDay = null;
let moodData = {};

// 🔄 Load moodData from localStorage
const savedData = localStorage.getItem("moodData");
if (savedData) {
  try {
    moodData = JSON.parse(savedData);
  } catch (err) {
    console.warn("Invalid saved mood data.");
  }
}

// Populate month and year dropdowns
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
    opt.value = y;
    opt.text = y;
    yearSelect.appendChild(opt);
  }
}

// Generate calendar grid
function generateCalendar(year, month) {
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  monthYear.textContent = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  calendar.innerHTML = "";

  for (let i = 0; i < firstDay; i++) {
    calendar.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.classList.add("day");
    cell.dataset.day = day;
    cell.innerHTML = `${day}`;

    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add("today");
    }

    const key = `mood-${year}-${month}-${day}`;
    const savedEmoji = moodData[key];
    if (savedEmoji) {
      const emojiSpan = document.createElement("span");
      emojiSpan.classList.add("emoji");
      emojiSpan.textContent = savedEmoji;
      cell.appendChild(emojiSpan);

      // 🎨 Background color depending on emoji
      if (savedEmoji === "😄") cell.style.background = "#d4fdd4"; // green
      if (savedEmoji === "🙂") cell.style.background = "#e6ffe6";
      if (savedEmoji === "😐") cell.style.background = "#ffffcc";
      if (savedEmoji === "😕") cell.style.background = "#ffe6cc";
      if (savedEmoji === "😠") cell.style.background = "#ffcccc"; // red
    }

    cell.addEventListener("click", () => {
      selectedDay = { year, month, day };
      emojiModal.classList.remove("hidden");
    });

    calendar.appendChild(cell);
  }
}

// Emoji selection logic
emojiOptions.forEach(option => {
  option.addEventListener("click", () => {
    const emoji = option.dataset.emoji;
    const { year, month, day } = selectedDay;
    const key = `mood-${year}-${month}-${day}`;

    if (emoji === "") {
      delete moodData[key];
    } else {
      moodData[key] = emoji;
    }

    // Save to localStorage
    localStorage.setItem("moodData", JSON.stringify(moodData));

    generateCalendar(year, month);
    emojiModal.classList.add("hidden");
  });
});

// Save button → also push to GitHub
saveBtn.addEventListener("click", async () => {
  // Save in localStorage
  localStorage.setItem("moodData", JSON.stringify(moodData));
  alert("✅ Mood data saved locally. Uploading to GitHub...");

  // 🔑 GitHub setup (replace with your repo info!)
  const GITHUB_USERNAME = "GiorgiMatchvavariani";
  const REPO = "emoji-mood-calendar";
  const FILE_PATH = "moods.json";
  const TOKEN = ".github/workflows/update-moods.yml"; // ⚠️ never share this publicly!

  const content = btoa(JSON.stringify(moodData, null, 2)); // encode to base64

  // 1️⃣ Get the current file SHA
  let sha = null;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `token ${TOKEN}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );
    if (res.ok) {
      const data = await res.json();
      sha = data.sha;
    }
  } catch (err) {
    console.error("Could not fetch current file SHA:", err);
  }

  // 2️⃣ Push update to GitHub
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Update moods.json from web app",
          content: content,
          sha: sha
        })
      }
    );

    if (res.ok) {
      alert("🎉 Moods synced to GitHub!");
    } else {
      const errData = await res.json();
      console.error("GitHub error:", errData);
      alert("⚠️ Failed to save to GitHub. Check console for details.");
    }
  } catch (err) {
    console.error("GitHub upload failed:", err);
    alert("⚠️ Error uploading to GitHub.");
  }
});

// Month and year navigation
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

function updateSelectors() {
  monthSelect.value = currentDate.getMonth();
  yearSelect.value = currentDate.getFullYear();
}

// Initialize
populateSelectors();
updateSelectors();
generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
