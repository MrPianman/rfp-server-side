// Refuel decision utilities.

function initRefuelMatrix(nodes, stations, defaultValue = 0) {
  const matrix = {};
  for (const i of nodes) {
    for (const k of stations) {
      matrix[`${i},${k}`] = Number(defaultValue);
    }
  }
  return matrix;
}

function setRefuel(xMatrix, i, k, value) {
  if (value < 0) throw new Error("Refilled fuel x_{i,k} must be >= 0");
  const key = `${i},${k}`;
  if (!(key in xMatrix)) throw new Error("(i, k) not in refuel matrix");
  xMatrix[key] = value;
}

function isRefueling(fuelAmount) {
  return fuelAmount > 0 ? 1 : 0;
}

function totalRefuel(xMatrix) {
  return Object.values(xMatrix).reduce((sum, v) => sum + Number(v), 0);
}

module.exports = {
  initRefuelMatrix,
  setRefuel,
  isRefueling,
  totalRefuel,
};
