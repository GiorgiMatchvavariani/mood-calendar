const calendar = document.getElementById("calendar");
const saveBtn = document.getElementById("saveBtn");

let selectedDate = null;
let moodData = {};

// Load moods from GitHub-hosted JSON
async function loadMoods() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/GiorgiMatchvavariani/mood-calendar/main/moods.json");
    if (res.ok) {
      moodData = await res.json();
    }
  } catch (e) {
    console.error("Could not load moods.json", e);
  }
  renderCalendar();
}

// Save moods to GitHub via Action (secure)
async function saveToCloud() {
  await fetch("https://api.github.com/repos/GiorgiMatchvavariani/mood-calendar/dispatches", {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json"
    },
    body: JSON.stringify({
      event_type: "update-moods",
      client_payload: {
        data: JSON.stringify(moodData, null, 2)
      }
    })
  });
}

function renderCalendar() {
  calendar.innerHTML = "";
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${month + 1}-${day}`;
    const cell = document.createElement("div");
    cell.className = "day";
    cell.dataset.date = dateStr;

    cell.textContent = moodData[dateStr] || day;

    cell.addEventListener("click", () => {
      document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
      cell.classList.add("selected");
      selectedDate = dateStr;
    });

    calendar.appendChild(cell);
  }
}

// Emoji picker
document.querySelectorAll(".emoji").forEach(emoji => {
  emoji.addEventListener("click", () => {
    if (selectedDate) {
      moodData[selectedDate] = emoji.dataset.emoji;
      renderCalendar();
    } else {
      alert("Please select a day first!");
    }
  });
});

// Save button
saveBtn.addEventListener("click", async () => {
  localStorage.setItem("moodData", JSON.stringify(moodData));
  await saveToCloud();
  alert("Mood data saved to GitHub!");
});

// Load on start
loadMoods();
