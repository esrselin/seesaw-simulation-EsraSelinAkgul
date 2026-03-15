const plank = document.getElementById("plank");
const objectsLayer = document.getElementById("objects-layer");
const resetButton = document.getElementById("reset-button");
const pauseButton = document.getElementById("pause-button");
const eventLog = document.getElementById("event-log");

const leftWeightElement = document.getElementById("left-weight");
const rightWeightElement = document.getElementById("right-weight");
const nextWeightElement = document.getElementById("next-weight");
const tiltAngleElement = document.getElementById("tilt-angle");

const objects = [];

let nextWeight = getRandomWeight();
let tiltTimeout;
let currentAngle = 0;
let isPaused = false;

function getRandomWeight() {
  return Math.floor(Math.random() * 10) + 1;
}

function getObjectSize(weight) {
  return 22 + weight * 3;
}

function getColor(weight) {
  if (weight <= 3) return "#4CAF50";
  if (weight <= 6) return "#FF69B4";
  if (weight <= 9) return "#2196F3";
  return "#E53935";
}

function calculateStats(objects) {
  let leftTorque = 0;
  let rightTorque = 0;
  let leftWeight = 0;
  let rightWeight = 0;

  objects.forEach((object) => {
    if (object.position < 0) {
      leftTorque += object.weight * Math.abs(object.position);
      leftWeight += object.weight;
    } else if (object.position > 0) {
      rightTorque += object.weight * object.position;
      rightWeight += object.weight;
    }
  });

  return { leftTorque, rightTorque, leftWeight, rightWeight };
}

function calculateAngle(leftTorque, rightTorque) {
  const rawAngle = (rightTorque - leftTorque) / 25;
  return Math.max(-30, Math.min(30, rawAngle));
}

function updateInfoPanel(leftWeight, rightWeight, angle) {
  leftWeightElement.textContent = `${leftWeight} kg`;
  rightWeightElement.textContent = `${rightWeight} kg`;
  nextWeightElement.textContent = `${nextWeight} kg`;
  tiltAngleElement.textContent = `${angle}°`;
}

function getLocalDistanceFromCenter(event) {
  const wrapper = document.querySelector(".seesaw-wrapper");
  const wrapperRect = wrapper.getBoundingClientRect();

  const centerX = wrapperRect.left + wrapperRect.width / 2;
  const plankCenterY = wrapperRect.top + 80 + 11 / 2;

  const dx = event.clientX - centerX;
  const dy = event.clientY - plankCenterY;

  const angle = (-currentAngle * Math.PI) / 180;

  return Math.round(dx * Math.cos(angle) - dy * Math.sin(angle));
}

function clampPosition(position, weight) {
  const half = plank.clientWidth / 2;
  const radius = getObjectSize(weight) / 2;

  const min = -half - 25 + radius;
  const max = half + 25 - radius;

  return Math.round(Math.min(Math.max(position, min), max));
}

function renderObjects() {
  objectsLayer.innerHTML = "";

  const plankCenter = plank.clientWidth / 2;

  objects.forEach((object, index) => {
    const el = document.createElement("div");
    const size = getObjectSize(object.weight);

    el.classList.add("object");
    if (index === objects.length - 1) el.classList.add("is-new");

    el.style.left = `${plankCenter + object.position}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.backgroundColor = getColor(object.weight);
    el.textContent = `${object.weight}kg`;

    objectsLayer.appendChild(el);
  });
}

function addLog(weight, position) {
  let side;

  if (position < 0) {
    side = "left";
  } else if (position > 0) {
    side = "right";
  } else {
    side = "center";
  }

  const distance = Math.abs(position);

  const log = document.createElement("div");
  log.className = "log-item";
  log.textContent = `${weight}kg dropped on ${side} side at ${distance}px from center`;

  eventLog.prepend(log);
}

function showPauseMessage() {
  let pauseMessage = document.getElementById("pause-message");

  if (!pauseMessage) {
    pauseMessage = document.createElement("div");
    pauseMessage.id = "pause-message";
    pauseMessage.textContent = "Game Paused";
    document.querySelector(".scene").appendChild(pauseMessage);
  }

  pauseMessage.style.display = "flex";
}

function hidePauseMessage() {
  const pauseMessage = document.getElementById("pause-message");
  if (pauseMessage) pauseMessage.style.display = "none";
}

function togglePause() {
  isPaused = !isPaused;

  if (isPaused) {
    pauseButton.textContent = "Resume";
    showPauseMessage();
    return;
  }

  pauseButton.textContent = "Pause";
  hidePauseMessage();
}

function resetSeesaw() {
  localStorage.removeItem("seesawState");
  location.reload();
}

function saveState() {
  localStorage.setItem("seesawState", JSON.stringify({ objects, nextWeight }));
}

function loadState() {
  const savedState = localStorage.getItem("seesawState");
  if (!savedState) return;

  const parsedState = JSON.parse(savedState);

  if (Array.isArray(parsedState.objects)) objects.push(...parsedState.objects);
  if (parsedState.nextWeight) nextWeight = parsedState.nextWeight;
}

function syncUI() {
  renderObjects();

  const { leftTorque, rightTorque, leftWeight, rightWeight } = calculateStats(objects);
  const angle = calculateAngle(leftTorque, rightTorque);

  currentAngle = angle;
  plank.style.transform = `translateX(-50%) rotate(${angle}deg)`;

  updateInfoPanel(leftWeight, rightWeight, angle);
}

plank.addEventListener("click", (event) => {
  if (isPaused) return;

  const weight = nextWeight;
  const position = clampPosition(getLocalDistanceFromCenter(event), weight);

  objects.push({ weight, position });
  renderObjects();
  addLog(weight, position);

  const { leftTorque, rightTorque, leftWeight, rightWeight } = calculateStats(objects);
  const angle = calculateAngle(leftTorque, rightTorque);

  nextWeight = getRandomWeight();
  updateInfoPanel(leftWeight, rightWeight, angle);
  saveState();

  tiltTimeout = setTimeout(() => {
    currentAngle = angle;
    plank.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  }, 350);
});

resetButton.addEventListener("click", resetSeesaw);
pauseButton.addEventListener("click", togglePause);

loadState();
syncUI();