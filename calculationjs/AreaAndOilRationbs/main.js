// Area and oil ration calculations based on provided equations.

function specificFuelCostPerKm(p_a_beta, f_a, f_u, e_a_beta_D, e_T_prime, q_a_beta) {
  const consumptionPerKm = f_a + f_u * e_a_beta_D + e_T_prime * q_a_beta;
  if (p_a_beta < 0) throw new Error("Fuel price p_{aβ} must be non-negative.");
  if (consumptionPerKm <= 0) throw new Error("Fuel consumption per km must be positive.");
  return p_a_beta * consumptionPerKm;
}

function totalTransportCost(sectionLengths, specificCosts) {
  let total = 0;
  for (const beta of Object.keys(sectionLengths)) {
    if (!(beta in specificCosts)) throw new Error(`Missing specific cost for section ${beta}`);
    const length = sectionLengths[beta];
    const costPerKm = specificCosts[beta];
    total += length * costPerKm;
  }
  return total;
}

function maxDistanceToFirstRefuel(Q_ind, Q_B, f_a, f_u, e_a_beta_D, e_T_prime, q_a_beta) {
  const numerator = Q_ind - Q_B;
  if (numerator <= 0) throw new Error("Available fuel (Q_ind - Q_B) must be positive to drive any distance.");
  const denominator = f_a + f_u * e_a_beta_D + e_T_prime * q_a_beta;
  if (denominator <= 0) throw new Error("Fuel consumption per distance must be positive.");
  return numerator / denominator;
}

module.exports = {
  specificFuelCostPerKm,
  totalTransportCost,
  maxDistanceToFirstRefuel,
};
