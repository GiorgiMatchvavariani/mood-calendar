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

// Populate
