const calendar = document.getElementById("calendar");
const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearDataBtn = document.getElementById("clearDataBtn");
const monthSelect = document.getElementById("month");
const yearSelect = document.getElementById("year");
const commentInput = document.getElementById("comment");
const feedback = document.getElementById("feedback");

let selectedDate = null;
let moodData = {};

// Load data from local storage or fetch from GitHub if available
async function loadData() {
  try {
    const storedData = localStorage.getItem("moodData");
    if (storedData) {
      moodData = JSON.parse(storedData);
      feedback.textContent = "Loaded data from local storage.";
    } else {
      // Optional: Fetch from GitHub moods.json
      const res = await fetch("https://raw.githubusercontent.com/GiorgiMatchvavariani/mood-calendar/main/moods.json");
      if (res.ok) {
        moodData = await res.json();
        feedback.textContent = "Loaded data from GitHub.";
      }
    }
  } catch (e) {
    console.error("Error loading data:", e);
    feedback.textContent = "No saved data found.";
  }
  renderCalendar();
}

// Populate year selector
function populateYears() {
  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = "";
  for (let y = currentYear - 10; y <= currentYear + 10; y++) {  // Expanded range for better UX
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
  yearSelect.value = currentYear;
  monthSelect.value = new Date().getMonth();
}

// Render calendar
function renderCalendar() {
  calendar.innerHTML = "";
  const year = parseInt(yearSelect.value);
  const month = parseInt(monthSelect.value);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Add padding days
  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day empty";
    calendar.appendChild(emptyCell);
  }

  // Add actual days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement("div");
    cell.className = "day";
    cell.dataset.date = dateStr;
    cell.textContent = moodData[dateStr] ? moodData[dateStr].emoji : day;

    if (moodData[dateStr]) {
      cell.classList.add(`mood-${moodData[dateStr].mood}`);
      if (moodData[dateStr].comment) {
        cell.title = `Comment: ${moodData[dateStr].comment}`;
      }
    }

    if (dateStr === todayStr) {
      cell.classList.add("today");
    }

    cell.addEventListener("click", () => handleDayClick(cell, dateStr));
    calendar.appendChild(cell);
  }
}

// Handle day selection
function handleDayClick(cell, dateStr) {
  document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
  cell.classList.add("selected");
  selectedDate = dateStr;
  commentInput.value = moodData[dateStr]?.comment || "";
  feedback.textContent = `Selected date: ${dateStr}`;
}

// Emoji selection
document.querySelectorAll(".emoji").forEach(emoji => {
  emoji.addEventListener("click", () => {
    if (!selectedDate) {
      feedback.textContent = "Select a day first!";
      return;
    }
    moodData[selectedDate] = {
      emoji: emoji.dataset.emoji,
      mood: emoji.dataset.mood,
      comment: commentInput.value.trim()
    };
    feedback.textContent = `Mood set: ${emoji.dataset.emoji} for ${selectedDate}`;
    renderCalendar();
  });
});

// Save changes
saveBtn.addEventListener("click", () => {
  if (!selectedDate) {
    feedback.textContent = "Select a day first!";
    return;
  }
  moodData[selectedDate].comment = commentInput.value.trim();
  localStorage.setItem("moodData", JSON.stringify(moodData));
  feedback.textContent = "Changes saved!";
  renderCalendar();
});

// Download JSON
downloadBtn.addEventListener("click", () => {
  const dataStr = JSON.stringify(moodData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "moods.json";
  link.click();
  URL.revokeObjectURL(url);
  feedback.textContent = "Downloaded moods.json";
});

// Clear data
clearDataBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all data?")) {
    moodData = {};
    localStorage.removeItem("moodData");
    renderCalendar();
    feedback.textContent = "All data cleared.";
  }
});

// Update calendar
function updateCalendar() {
  renderCalendar();
}

// Initialize
loadData();
populateYears();
renderCalendar();
