// Cost components for a two-echelon example.

// Sets
const Nd = ["d0", "d1"]; // depots
const Ns = ["s0", "s1"]; // satellites
const Nc = ["c0", "c1", "c2"]; // customers
const Kd = ["k0", "k1"]; // vehicles at depots
const Ks = ["k2", "k3"]; // vehicles at satellites
const N1 = [...Nd, ...Ns];
const N2 = [...Ns, ...Nc];
const Tnc = Object.fromEntries(Nc.map((j) => [j, ["l0", "l1"]]));

// Parameters
const fC = { k0: 5, k1: 5, k2: 3, k3: 3 }; // fixed cost per vehicle k
const fV = { k0: 2, k1: 3, k2: 4, k3: 1 }; // variable cost factor per km
const dist = {};
for (const i of N1) {
  for (const j of N1) {
    if (i !== j) dist[`${i},${j}`] = 67;
  }
}
for (const i of N2) {
  for (const j of N2) {
    if (i !== j) dist[`${i},${j}`] = 67;
  }
}
const Cl = { l0: 2, l1: 3 }; // price per product l
const Ql = { l0: 4, l1: 5 }; // quantity per product l

// Parameters for C3 (toy values)
const fs = Object.fromEntries(Ns.map((i) => [i, 5])); // opening cost per satellite i
const o = Object.fromEntries(Ns.map((i) => [i, 1])); // open/close indicator

// Decision variables (binary in a real model). Example values.
const X1 = Object.fromEntries(
  Nd.flatMap((i) => Ns.flatMap((j) => Kd.map((k) => [[i, j, k].join(","), 1])))
);
const Y1 = Object.fromEntries(
  Ns.flatMap((j) => Nc.flatMap((i) => Ks.map((k) => [[j, i, k].join(","), 1])))
);
const X2 = Object.fromEntries(
  N1.flatMap((i) => N1.filter((j) => j !== i).flatMap((j) => Kd.map((k) => [[i, j, k].join(","), 1])))
);
const Y2 = Object.fromEntries(
  N2.flatMap((i) => N2.filter((j) => j !== i).flatMap((j) => Ks.map((k) => [[i, j, k].join(","), 1])))
);
const X3 = Object.fromEntries(Ns.map((i) => [i, 1]));
const Y3 = Object.fromEntries(Nc.map((j) => [j, 1]));

function fixedCostOfVehicle(X_vars, Y_vars, fixed_costs) {
  const c1o1 = Nd.reduce((acc, i) => acc + Ns.reduce((a, j) => a + Kd.reduce((s, k) => s + fixed_costs[k] * (X_vars[[i, j, k].join(",")] || 0), 0), 0), 0);
  const c1o2 = Ns.reduce((acc, j) => acc + Nc.reduce((a, i) => a + Ks.reduce((s, k) => s + fixed_costs[k] * (Y_vars[[j, i, k].join(",")] || 0), 0), 0), 0);
  return c1o1 + c1o2;
}

function variableCostOfVehicle(XX, YY, fix, distance) {
  const c2o1 = N1.reduce(
    (acc, i) => acc + N1.filter((j) => j !== i).reduce((a, j) => a + Kd.reduce((s, k) => s + (distance[`${i},${j}`] || 0) * fix[k] * (XX[[i, j, k].join(",")] || 0), 0), 0),
    0
  );
  const c2o2 = N2.reduce(
    (acc, i) => acc + N2.filter((j) => j !== i).reduce((a, j) => a + Ks.reduce((s, k) => s + (distance[`${i},${j}`] || 0) * fix[k] * (YY[[i, j, k].join(",")] || 0), 0), 0),
    0
  );
  return c2o1 + c2o2;
}

function customerCost(fsMap, openMap, products, price, qty) {
  const openCost = Ns.reduce((acc, i) => acc + (fsMap[i] || 0) * (openMap[i] || 0), 0);
  const productCost = Nc.reduce(
    (acc, j) => acc + (products[j] || []).reduce((a, l) => a + (price[l] || 0) * (qty[l] || 0), 0),
    0
  );
  return openCost + productCost;
}

function summing(a, b, c) {
  return a + b + c;
}

module.exports = {
  Nd,
  Ns,
  Nc,
  Kd,
  Ks,
  N1,
  N2,
  Tnc,
  fC,
  fV,
  dist,
  Cl,
  Ql,
  fs,
  o,
  X1,
  Y1,
  X2,
  Y2,
  X3,
  Y3,
  fixedCostOfVehicle,
  variableCostOfVehicle,
  customerCost,
  summing,
};
