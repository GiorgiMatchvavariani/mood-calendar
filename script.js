const calendar = document.getElementById("calendar");
const saveBtn = document.getElementById("saveBtn");
const monthSelect = document.getElementById("month");
const yearSelect = document.getElementById("year");
const commentInput = document.getElementById("comment");
const feedback = document.getElementById("feedback");

let selectedDate = null;
let moodData = JSON.parse(localStorage.getItem("moodData")) || {};

// Populate year selector
function populateYears() {
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
  yearSelect.value = currentYear;
  monthSelect.value = new Date().getMonth();
}

// Render calendar for selected month/year
function renderCalendar() {
  calendar.innerHTML = "";
  const year = parseInt(yearSelect.value);
  const month = parseInt(monthSelect.value);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  // Add empty cells for days before the first day
  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day";
    calendar.appendChild(emptyCell);
  }

  // Add days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${month + 1}-${day}`;
    const cell = document.createElement("div");
    cell.className = "day";
    cell.dataset.date = dateStr;

    // Highlight today
    if (dateStr === todayStr) {
      cell.classList.add("today");
    }

    // Display emoji if mood exists, otherwise day number
    cell.textContent = moodData[dateStr] ? moodData[dateStr].emoji : day;
    if (moodData[dateStr]) {
      cell.classList.add(`mood-${moodData[dateStr].mood}`);
      if (moodData[dateStr].comment) {
        cell.title = moodData[dateStr].comment; // Show comment on hover
      }
    }

    cell.addEventListener("click", () => {
      document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
      cell.classList.add("selected");
      selectedDate = dateStr;
      commentInput.value = moodData[dateStr]?.comment || "";
      feedback.textContent = `Selected: ${dateStr}`;
    });

    calendar.appendChild(cell);
  }
}

// Update calendar when month/year changes
function updateCalendar() {
  renderCalendar();
  feedback.textContent = "";
}

// Emoji picker
document.querySelectorAll(".emoji").forEach(emoji => {
  emoji.addEventListener("click", () => {
    if (selectedDate) {
      moodData[selectedDate] = {
        emoji: emoji.dataset.emoji,
        mood: emoji.dataset.mood,
        comment: moodData[selectedDate]?.comment || ""
      };
      renderCalendar();
      feedback.textContent = `Mood ${emoji.dataset.emoji} set for ${selectedDate}`;
    } else {
      feedback.textContent = "Please select a day first!";
    }
  });
});

// Save button
saveBtn.addEventListener("click", () => {
  if (!selectedDate) {
    feedback.textContent = "Please select a day first!";
    return;
  }
  if (!moodData[selectedDate]?.emoji) {
    feedback.textContent = "Please select a mood first!";
    return;
  }
  moodData[selectedDate].comment = commentInput.value.trim();
  localStorage.setItem("moodData", JSON.stringify(moodData));
  feedback.textContent = "Mood and comment saved locally!";
  renderCalendar();
});

// Initialize
populateYears();
renderCalendar();
