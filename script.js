
// ==========================================
// DIGEST - GLOBAL VARIABLES
// ==========================================

let words = [];
let angle = 0;
let spinning = false;
let selectedTopic = "";

let timer;
let timeLeft = 300;
let paused = false;
let timerStarted = false;
let currentPhase = "research";

let currentMode = localStorage.getItem("randomiserMode") || "normal";

const canvas = document.getElementById("wheelCanvas");
let ctx = canvas ? canvas.getContext("2d") : null;

const selectionSound = new Audio("ding.mp3");
const timerEndSound = new Audio("end.mp3");
const tickingSound = new Audio("tick.mp3");

tickingSound.loop = true;


// ==========================================
// STORAGE HELPERS
// ==========================================

function saveCurrentWords() {
  localStorage.setItem("currentWords", JSON.stringify(words));
}

function loadCurrentWords() {
  return JSON.parse(localStorage.getItem("currentWords")) || [];
}

function clearCurrentWords() {
  localStorage.removeItem("currentWords");
}

function saveCurrentTopic(word) {
  localStorage.setItem("topicWord", word);
}

function loadCurrentTopic() {
  return localStorage.getItem("topicWord") || "";
}

function clearCurrentTopic() {
  localStorage.removeItem("topicWord");
}


// ==========================================
// INITIAL SETUP
// ==========================================

window.addEventListener("load", function () {

  const inputEl = document.getElementById("wordInput");

  // Main randomiser page
  if (inputEl) {

    resizeCanvasForDevice();

    const modeSelect = document.getElementById("modeSelect");

    if (modeSelect) {
      modeSelect.value = currentMode;
      updateModeUI();
    }

    const savedBatch = loadCurrentWords();

    if (savedBatch.length > 0) {

      words = savedBatch;

      document.getElementById("inputSection").style.display = "block";
      document.getElementById("wheelContainer").style.display = "flex";

      document.getElementById("spinBtn").style.display = "block";
      document.getElementById("wordInput").value = words.join("\n");

      drawRotatedWheel();

      const previousTopic = loadCurrentTopic();

      if (previousTopic) {
        selectedTopic = previousTopic;

        const selectedEl = document.getElementById("selectedWord");
        selectedEl.innerText = "Previously selected: " + previousTopic;
      }
    }
  }

  // Timer page
  const topicElement = document.getElementById("topicWord");

  if (topicElement) {
    const topic = loadCurrentTopic() || "No topic selected";
    topicElement.innerText = "Topic: " + topic;
    updateTimer();
  }

});

window.addEventListener("resize", resizeCanvasForDevice);


// ==========================================
// MODE SELECTION
// ==========================================

function setMode(mode) {

  currentMode = mode;

  localStorage.setItem("randomiserMode", mode);

  updateModeUI();
}


function updateModeUI() {

  const timerBtn = document.getElementById("startTimerBtn");

  if (!timerBtn) return;

  if (currentMode === "study" && selectedTopic) {
    timerBtn.style.display = "block";
  } else {
    timerBtn.style.display = "none";
  }
}


// ==========================================
// CANVAS RESIZING
// ==========================================

function resizeCanvasForDevice() {

  if (!canvas) return;

  const width = window.innerWidth;

  if (width <= 480) {
    canvas.width = 400;
    canvas.height = 400;
  } else if (width <= 900) {
    canvas.width = 500;
    canvas.height = 500;
  } else {
    canvas.width = 600;
    canvas.height = 600;
  }

  if (words.length > 0) {
    drawRotatedWheel();
  }
}


// ==========================================
// WHEEL COLOURS
// ==========================================

function getColor(i) {

  if (words.length % 2 === 0) {
    return i % 2 === 0 ? "#000000" : "#f0ceb2";
  }

  const colors = ["#000000", "#f0ceb2", "#444444"];

  return colors[i % 3];
}


// ==========================================
// DRAW WHEEL
// ==========================================

function drawWheel() {

  if (!ctx || words.length === 0) return;

  const size = canvas.width / 2;
  const arc = (Math.PI * 2) / words.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < words.length; i++) {

    const angleStart = i * arc;

    ctx.beginPath();
    ctx.moveTo(size, size);

    ctx.arc(
      size,
      size,
      size,
      angleStart,
      angleStart + arc
    );

    ctx.closePath();

    ctx.fillStyle = getColor(i);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // WORD LABELS
    ctx.save();

    ctx.translate(size, size);
    ctx.rotate(angleStart + arc / 2);

    ctx.fillStyle = words.length % 2 === 0
      ? (i % 2 === 0 ? "#ffffff" : "#000000")
      : "#ffffff";

    const fontSize = Math.max(12, Math.floor(size / 13));

    ctx.font = `600 ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let text = words[i];

    if (text.length > 15) {
      text = text.slice(0, 15) + "...";
    }

    ctx.fillText(text, size * 0.62, 0);

    ctx.restore();
  }
}


// ==========================================
// ROTATE WHEEL
// ==========================================

function drawRotatedWheel() {

  if (!ctx || words.length === 0) return;

  const size = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.translate(size, size);
  ctx.rotate(angle);
  ctx.translate(-size, -size);

  drawWheel();

  ctx.restore();
}


// ==========================================
// SPIN MECHANICS
// ==========================================

function spinWheel() {

  if (spinning || words.length < 1) return;

  spinning = true;

  canvas.classList.add("spinGlow");

  let angularVelocity = Math.random() * 0.18 + 0.28;

  function rotate() {

    angularVelocity *= 0.98;

    angle += angularVelocity;

    drawRotatedWheel();

    if (angularVelocity > 0.002) {

      requestAnimationFrame(rotate);

    } else {

      spinning = false;

      selectWord();

    }
  }

  rotate();
}


// ==========================================
// HANDLE SPIN BUTTON
// ==========================================

function handleSpin() {

  if (spinning) return;

  const inputEl = document.getElementById("wordInput");

  if (words.length === 0) {

    const input = inputEl.value;

    words = input
      .split("\n")
      .map(w => w.trim())
      .filter(w => w !== "");

    if (words.length < 2) {
      alert("Please enter at least 2 words.");
      words = [];
      return;
    }

    if (words.length > 20) {
      alert("Please keep it to 20 words or less.");
      words = [];
      return;
    }

    saveCurrentWords();

    document.getElementById("inputSection").style.display = "block";
  }

  if (words.length === 0) return;

  document.getElementById("wheelContainer").style.display = "flex";

  document.getElementById("selectedWord").innerText = "";
  document.getElementById("selectedWord").style.display = "none";

  document.getElementById("spinBtn").style.display = "none";
  document.getElementById("startTimerBtn").style.display = "none";

  drawRotatedWheel();

  spinWheel();
}


// ==========================================
// SELECT WORD
// ==========================================

function selectWord() {

  canvas.classList.remove("spinGlow");

  let normalizedAngle = angle % (2 * Math.PI);

  if (normalizedAngle < 0) {
    normalizedAngle += 2 * Math.PI;
  }

  const arc = (2 * Math.PI) / words.length;

  let index = Math.floor(
    ((2 * Math.PI - normalizedAngle) % (2 * Math.PI)) / arc
  );

  if (index >= words.length) {
    index = 0;
  }

  const chosen = words[index];

  selectedTopic = chosen;

  // REMOVE SELECTED WORD IMMEDIATELY
  words.splice(index, 1);

  saveCurrentWords();
  saveCurrentTopic(chosen);

  // DISPLAY SELECTED WORD
  const selectedEl = document.getElementById("selectedWord");

  selectedEl.innerText = chosen;
  selectedEl.style.display = "block";

  // UPDATE REMAINING WHEEL
  if (words.length > 0) {

    document.getElementById("wheelContainer").style.display = "flex";

    drawRotatedWheel();

    document.getElementById("spinBtn").style.display = "block";

  } else {

    document.getElementById("wheelContainer").style.display = "none";

    document.getElementById("spinBtn").style.display = "none";

    selectedEl.innerText = chosen + " — BATCH COMPLETE";

  }

  // TIMER ONLY AVAILABLE IN STUDY MODE
  updateModeUI();

  selectionSound.currentTime = 0;
  selectionSound.play().catch(() => {});
}


// ==========================================
// CLEAR WORDS
// ==========================================

function clearWords() {

  if (spinning) return;

  words = [];
  angle = 0;
  selectedTopic = "";

  clearCurrentWords();
  clearCurrentTopic();

  document.getElementById("wordInput").value = "";

  document.getElementById("wheelContainer").style.display = "none";

  document.getElementById("selectedWord").innerText = "";
  document.getElementById("selectedWord").style.display = "none";

  document.getElementById("startTimerBtn").style.display = "none";

  document.getElementById("spinBtn").style.display = "block";

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}


// ==========================================
// GO TO TIMER
// ==========================================

function goToTimer() {

  if (currentMode !== "study" || !selectedTopic) return;

  saveCurrentWords();
  saveCurrentTopic(selectedTopic);

  window.location.href = "timer.html";
}


// ==========================================
// TIMER FUNCTIONS
// ==========================================

function beginTimer() {

  if (timerStarted) return;

  timerStarted = true;
  paused = false;
  currentPhase = "research";
  timeLeft = 300;

  const beginBtn = document.getElementById("beginTimerBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const readyBtn = document.getElementById("readyBtn");
  const continueBtn = document.getElementById("continueBtn");
  const label = document.getElementById("timerLabel");

  if (label) label.innerText = "Research / Plan";

  if (beginBtn) beginBtn.style.display = "none";

  if (pauseBtn) {
    pauseBtn.style.display = "inline-block";
    pauseBtn.innerText = "⏸";
  }

  if (readyBtn) readyBtn.style.display = "inline-block";

  if (continueBtn) continueBtn.style.display = "none";

  updateTimer();

  tickingSound.currentTime = 0;
  tickingSound.play().catch(() => {});

  startTimer();
}


function startTimer() {

  const display = document.getElementById("timerDisplay");

  if (!display) return;

  clearInterval(timer);

  timer = setInterval(() => {

    if (paused) return;

    timeLeft--;

    updateTimer();

    if (timeLeft <= 0) {

      if (currentPhase === "research") {

        goToExplainPhase();

      } else if (currentPhase === "explain") {

        clearInterval(timer);

        timerEndSound.currentTime = 0;
        timerEndSound.play().catch(() => {});

        const pauseBtn = document.getElementById("pauseBtn");
        const readyBtn = document.getElementById("readyBtn");
        const continueBtn = document.getElementById("continueBtn");

        if (pauseBtn) pauseBtn.style.display = "none";
        if (readyBtn) readyBtn.style.display = "none";
        if (continueBtn) continueBtn.style.display = "inline-block";

      }

    }

  }, 1000);
}


function goToExplainPhase() {

  currentPhase = "explain";
  timeLeft = 60;

  const label = document.getElementById("timerLabel");

  if (label) label.innerText = "Explain";

  const readyBtn = document.getElementById("readyBtn");

  if (readyBtn) readyBtn.style.display = "none";

  tickingSound.pause();
  tickingSound.currentTime = 0;

  updateTimer();
}


function readyNext() {

  if (!timerStarted || currentPhase !== "research") return;

  goToExplainPhase();
}


function pauseTimer() {

  if (!timerStarted) return;

  paused = !paused;

  const btn = document.getElementById("pauseBtn");

  if (btn) {
    btn.innerText = paused ? "▶" : "⏸";
  }

  if (paused) {

    tickingSound.pause();

  } else {

    if (currentPhase === "research") {
      tickingSound.play().catch(() => {});
    }

  }
}


function clearTimer() {

  clearInterval(timer);

  timerStarted = false;
  paused = false;
  timeLeft = 300;
  currentPhase = "research";

  tickingSound.pause();
  tickingSound.currentTime = 0;

  timerEndSound.pause();
  timerEndSound.currentTime = 0;

  clearCurrentWords();
  clearCurrentTopic();

  window.location.href = "index.html";
}


// ==========================================
// CONTINUE TO NEXT WORD
// ==========================================

function continueBatch() {

  const currentWords = loadCurrentWords();

  // SELECTED WORD WAS ALREADY REMOVED AFTER SPIN
  clearCurrentTopic();

  if (currentWords.length === 0) {

    clearCurrentWords();

    alert("Batch complete! Please enter a new set of words.");

    window.location.href = "index.html";

    return;
  }

  window.location.href = "index.html";
}


// ==========================================
// UPDATE TIMER DISPLAY
// ==========================================

function updateTimer() {

  const display = document.getElementById("timerDisplay");

  if (!display) return;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;

  display.innerText =
    String(m).padStart(2, "0") + ":" +
    String(s).padStart(2, "0");
}


// ==========================================
// SAVED WORD SETS
// ==========================================

function saveWords() {

  const input = document.getElementById("wordInput").value;

  const list = input
    .split("\n")
    .map(w => w.trim())
    .filter(w => w !== "");

  if (list.length < 2) {
    alert("You must enter at least 2 words.");
    return;
  }

  let savedSets = JSON.parse(localStorage.getItem("savedWordSets")) || [];

  const newSet = JSON.stringify(list);

  const exists = savedSets.some(set => JSON.stringify(set) === newSet);

  if (exists) {
    alert("This word set already exists.");
    return;
  }

  savedSets.push(list);

  localStorage.setItem("savedWordSets", JSON.stringify(savedSets));

  alert("Word set saved.");
}


function renderSavedLists() {

  const container = document.getElementById("savedContainer");

  if (!container) return;

  container.innerHTML = "";

  let savedSets = JSON.parse(localStorage.getItem("savedWordSets")) || [];

  savedSets.forEach((set, index) => {

    const div = document.createElement("div");

    div.className = "savedSet";

    const paragraph = document.createElement("p");
    paragraph.innerText = set.join(", ");

    const loadBtn = document.createElement("button");
    loadBtn.innerText = "Load";
    loadBtn.onclick = () => loadSavedSet(index);

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "Delete";
    deleteBtn.onclick = () => deleteSavedSet(index);

    div.appendChild(paragraph);
    div.appendChild(loadBtn);
    div.appendChild(deleteBtn);

    container.appendChild(div);

  });
}


function loadSavedSet(index) {

  let savedSets = JSON.parse(localStorage.getItem("savedWordSets")) || [];

  if (!savedSets[index]) return;

  if (spinning) return;

  words = [];
  angle = 0;
  selectedTopic = "";

  clearCurrentTopic();

  document.getElementById("wordInput").value = savedSets[index].join("\n");

  closeSavedUI();

  clearCurrentWords();

  document.getElementById("wheelContainer").style.display = "none";
  document.getElementById("selectedWord").style.display = "none";
  document.getElementById("startTimerBtn").style.display = "none";
  document.getElementById("spinBtn").style.display = "block";
}


function deleteSavedSet(index) {

  let savedSets = JSON.parse(localStorage.getItem("savedWordSets")) || [];

  savedSets.splice(index, 1);

  localStorage.setItem("savedWordSets", JSON.stringify(savedSets));

  renderSavedLists();
}


function openSavedUI() {

  const savedUI = document.getElementById("savedUI");

  if (!savedUI) return;

  savedUI.style.display = "flex";

  renderSavedLists();
}


function closeSavedUI() {

  const savedUI = document.getElementById("savedUI");

  if (savedUI) {
    savedUI.style.display = "none";
  }

}
