// Customer satisfaction with soft time windows.

function satisfaction(Ti, Tei, Tli, Tri, alpha = 1.0, beta = 1.0) {
  if (Ti < Tei) {
    const denom = Tli - Tei;
    if (denom <= 0) return 0;
    return Math.max(0, ((Tli - Ti) / denom) ** alpha);
  }
  if (Ti <= Tli) {
    return 1;
  }
  if (Ti <= Tri) {
    const denom = Tri - Tli;
    if (denom <= 0) return 0;
    return Math.max(0, ((Tri - Ti) / denom) ** beta);
  }
  return 0;
}

function averageSatisfaction(arrivals, Tei, Tli, Tri, alpha = 1.0, beta = 1.0) {
  const list = Array.from(arrivals || []);
  if (list.length === 0) return 0;
  const total = list.reduce((acc, t) => acc + satisfaction(t, Tei, Tli, Tri, alpha, beta), 0);
  return total / list.length;
}

module.exports = {
  satisfaction,
  averageSatisfaction,
};
