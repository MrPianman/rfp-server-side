// Refuel decision utilities.

const refuelKey = (i, k) => `${i}::${k}`;

function initRefuelMatrix(nodes, stations, defaultValue = 0) {
  const matrix = {};
  const base = Number(defaultValue);
  for (const i of nodes) {
    for (const k of stations) {
      matrix[refuelKey(i, k)] = base;
    }
  }
  return matrix;
}

function setRefuel(xMatrix, i, k, value) {
  if (value < 0) throw new Error("Refilled fuel x_{i,k} must be >= 0");
  const key = refuelKey(i, k);
  if (!(key in xMatrix)) throw new Error("(i, k) not in refuel matrix");
  xMatrix[key] = value;
}

function isRefueling(fuelAmount) {
  return fuelAmount > 0 ? 1 : 0;
}

function totalRefuel(xMatrix) {
  let sum = 0;
  for (const value of Object.values(xMatrix)) {
    sum += Number(value);
  }
  return sum;
}

module.exports = {
  initRefuelMatrix,
  setRefuel,
  isRefueling,
  totalRefuel,
};
