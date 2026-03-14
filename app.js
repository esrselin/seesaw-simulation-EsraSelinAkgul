const plank = document.getElementById("plank");

const objects = [];

function getRandomWeight() {
  return Math.floor(Math.random() * 10) + 1;
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

function calculateAngle(leftTorque, rightTorque) {
  const rawAngle = (rightTorque - leftTorque) / 10;
  const limitedAngle = Math.max(-30, Math.min(30, rawAngle));

  return limitedAngle;
}

plank.addEventListener("click", (event) => {
  const plankRect = plank.getBoundingClientRect();
  const clickX = event.clientX - plankRect.left;
  const centerX = plankRect.width / 2;
  const distanceFromCenter = Math.round(clickX - centerX);
  const weight = getRandomWeight();

  const newObject = {
    weight: weight,
    position: distanceFromCenter
  };

  objects.push(newObject);

  const { leftTorque, rightTorque } = calculateTorques(objects);
  const angle = calculateAngle(leftTorque, rightTorque);

  plank.style.transform = `translateX(-50%) rotate(${angle}deg)`;

  console.log("Left torque:", leftTorque);
  console.log("Right torque:", rightTorque);
  console.log("Angle:", angle);
  console.log("Distance from center:", distanceFromCenter);
  console.log("New object:", newObject);
  console.log("All objects:", objects);
});
