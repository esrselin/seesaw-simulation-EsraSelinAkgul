const plank = document.getElementById("plank");
const objectsLayer = document.getElementById("objects-layer");
const resetButton = document.getElementById("reset-button");

const leftWeightElement = document.getElementById("left-weight");
const rightWeightElement = document.getElementById("right-weight");
const nextWeightElement = document.getElementById("next-weight");
const tiltAngleElement = document.getElementById("tilt-angle");

const objects = [];

let nextWeight = getRandomWeight();
let tiltTimeout;
let currentAngle = 0;

function getRandomWeight() {
  return Math.floor(Math.random() * 10) + 1;
}

function getColor(weight) {
  if (weight <= 3) return "#4CAF50";
  if (weight <= 6) return "#FF69B4";
  if (weight <= 9) return "#2196F3";
  return "#E53935";
}

function calculateTorques(objects) {
  let leftTorque = 0;
  let rightTorque = 0;

  objects.forEach((object) => {
    if (object.position < 0) {
      leftTorque += object.weight * Math.abs(object.position);
    } else if (object.position > 0) {
      rightTorque += object.weight * object.position;
    }
  });

  return { leftTorque, rightTorque };
}

function calculateWeightTotals(objects) {
  let leftWeight = 0;
  let rightWeight = 0;

  objects.forEach((object) => {
    if (object.position < 0) {
      leftWeight += object.weight;
    } else if (object.position > 0) {
      rightWeight += object.weight;
    }
  });

  return { leftWeight, rightWeight };
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
  const rect = plank.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;

  const angleInRadians = (-currentAngle * Math.PI) / 180;

  const localX =
    dx * Math.cos(angleInRadians) - dy * Math.sin(angleInRadians);

  return Math.round(localX);
}

function clampPosition(position, weight) {
  const halfPlank = plank.clientWidth / 2;
  const objectSize = 22 + weight * 3;
  const objectRadius = objectSize / 2;

  const min = -halfPlank + objectRadius;
  const max = halfPlank - objectRadius;

  if (position < min) return Math.round(min);
  if (position > max) return Math.round(max);

  return position;
}

function renderObjects() {
  objectsLayer.innerHTML = "";

  const plankWidth = plank.clientWidth;
  const plankCenter = plankWidth / 2;

  objects.forEach((object, index) => {
    const el = document.createElement("div");
    el.classList.add("object");

    if (index === objects.length - 1) {
      el.classList.add("is-new");
    }

    const x = plankCenter + object.position;
    el.style.left = `${x}px`;

    const size = 22 + object.weight * 3;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    el.style.backgroundColor = getColor(object.weight);
    el.textContent = `${object.weight}kg`;

    objectsLayer.appendChild(el);
  });
}

function resetSeesaw() {
  localStorage.removeItem("seesawState")
  location.reload()
}

function saveState() {
  const state = {
    objects: objects,
    nextWeight: nextWeight
  };

  localStorage.setItem("seesawState", JSON.stringify(state));
}

function loadState() {
  const savedState = localStorage.getItem("seesawState");

  if (!savedState) {
    return;
  }

  const parsedState = JSON.parse(savedState);

  if (parsedState.objects && Array.isArray(parsedState.objects)) {
    objects.push(...parsedState.objects);
  }

  if (typeof parsedState.nextWeight === "number") {
    nextWeight = parsedState.nextWeight;
  }
}

function syncUI() {
  renderObjects();

  const { leftTorque, rightTorque } = calculateTorques(objects);
  const angle = calculateAngle(leftTorque, rightTorque);
  const { leftWeight, rightWeight } = calculateWeightTotals(objects);

  currentAngle = angle;
  plank.style.transform = `translateX(-50%) rotate(${angle}deg)`;

  updateInfoPanel(leftWeight, rightWeight, angle);
}

plank.addEventListener("click", (event) => {
  const weight = nextWeight;

  const rawDistanceFromCenter = getLocalDistanceFromCenter(event);
  const distanceFromCenter = clampPosition(rawDistanceFromCenter, weight);

  const newObject = {
    weight: weight,
    position: distanceFromCenter
  };

  objects.push(newObject);
  renderObjects();

  const { leftTorque, rightTorque } = calculateTorques(objects);
  const angle = calculateAngle(leftTorque, rightTorque);
  const { leftWeight, rightWeight } = calculateWeightTotals(objects);

  nextWeight = getRandomWeight();
  updateInfoPanel(leftWeight, rightWeight, angle);
  saveState();

  clearTimeout(tiltTimeout);
  tiltTimeout = setTimeout(() => {
    currentAngle = angle;
    plank.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  }, 350);

  console.log("Raw distance:", rawDistanceFromCenter);
  console.log("Clamped distance:", distanceFromCenter);
  console.log("Left torque:", leftTorque);
  console.log("Right torque:", rightTorque);
  console.log("Angle:", angle);
  console.log("New object:", newObject);
  console.log("All objects:", objects);
});

resetButton.addEventListener("click", resetSeesaw);

loadState();
syncUI();