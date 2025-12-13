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

const edgeKey = (i, j) => `${i},${j}`;
const arcKey = (i, j, k) => `${i},${j},${k}`;

// Parameters
const fC = { k0: 5, k1: 5, k2: 3, k3: 3 }; // fixed cost per vehicle k
const fV = { k0: 2, k1: 3, k2: 4, k3: 1 }; // variable cost factor per km
const dist = {};

function addCompleteDistances(nodes, store, value) {
  for (let idx = 0; idx < nodes.length; idx += 1) {
    const i = nodes[idx];
    for (let jdx = 0; jdx < nodes.length; jdx += 1) {
      const j = nodes[jdx];
      if (i !== j) store[edgeKey(i, j)] = value;
    }
  }
}

addCompleteDistances(N1, dist, 67);
addCompleteDistances(N2, dist, 67);

const Cl = { l0: 2, l1: 3 }; // price per product l
const Ql = { l0: 4, l1: 5 }; // quantity per product l

// Parameters for C3 (toy values)
const fs = Object.fromEntries(Ns.map((i) => [i, 5])); // opening cost per satellite i
const o = Object.fromEntries(Ns.map((i) => [i, 1])); // open/close indicator

// Precompute arcs to avoid filter overhead in hot loops.
const arcsN1 = [];
for (const i of N1) {
  for (const j of N1) {
    if (i !== j) arcsN1.push({ i, j });
  }
}
const arcsN2 = [];
for (const i of N2) {
  for (const j of N2) {
    if (i !== j) arcsN2.push({ i, j });
  }
}

// Decision variables (binary in a real model). Example values.
const X1 = Object.fromEntries(
  Nd.flatMap((i) => Ns.flatMap((j) => Kd.map((k) => [arcKey(i, j, k), 1])))
);
const Y1 = Object.fromEntries(
  Ns.flatMap((j) => Nc.flatMap((i) => Ks.map((k) => [arcKey(j, i, k), 1])))
);
const X2 = Object.fromEntries(arcsN1.flatMap(({ i, j }) => Kd.map((k) => [arcKey(i, j, k), 1])));
const Y2 = Object.fromEntries(arcsN2.flatMap(({ i, j }) => Ks.map((k) => [arcKey(i, j, k), 1])));
const X3 = Object.fromEntries(Ns.map((i) => [i, 1]));
const Y3 = Object.fromEntries(Nc.map((j) => [j, 1]));

function fixedCostOfVehicle(X_vars, Y_vars, fixed_costs) {
  let c1o1 = 0;
  for (const i of Nd) {
    for (const j of Ns) {
      for (const k of Kd) {
        c1o1 += fixed_costs[k] * (X_vars[arcKey(i, j, k)] || 0);
      }
    }
  }

  let c1o2 = 0;
  for (const j of Ns) {
    for (const i of Nc) {
      for (const k of Ks) {
        c1o2 += fixed_costs[k] * (Y_vars[arcKey(j, i, k)] || 0);
      }
    }
  }

  return c1o1 + c1o2;
}

function variableCostOfVehicle(XX, YY, fix, distance) {
  let c2o1 = 0;
  for (const { i, j } of arcsN1) {
    const distVal = distance[edgeKey(i, j)] || 0;
    for (const k of Kd) {
      c2o1 += distVal * fix[k] * (XX[arcKey(i, j, k)] || 0);
    }
  }

  let c2o2 = 0;
  for (const { i, j } of arcsN2) {
    const distVal = distance[edgeKey(i, j)] || 0;
    for (const k of Ks) {
      c2o2 += distVal * fix[k] * (YY[arcKey(i, j, k)] || 0);
    }
  }

  return c2o1 + c2o2;
}

function customerCost(fsMap, openMap, products, price, qty) {
  let openCost = 0;
  for (const i of Ns) {
    openCost += (fsMap[i] || 0) * (openMap[i] || 0);
  }

  let productCost = 0;
  for (const j of Nc) {
    const items = products[j] || [];
    for (const l of items) {
      productCost += (price[l] || 0) * (qty[l] || 0);
    }
  }

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
