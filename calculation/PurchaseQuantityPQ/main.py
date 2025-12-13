from typing import Dict, Hashable
def init_refuel_matrix(nodes, stations, default_value: float = 0.0) -> Dict[tuple, float]:
	"""Create the refilled-fuel decision matrix over nodes x stations.

	Args:
		nodes: iterable of road-section indices (N)
		stations: iterable of refuel stops (H)
		default_value: initial fuel amount (>=0)

	Returns:
		dict mapping (i, k) -> fuel refilled at node i, station k
	"""
	return {(i, k): float(default_value) for i in nodes for k in stations}


def set_refuel(x_matrix: Dict[tuple, float], i: Hashable, k: Hashable, value: float) -> None:
	if value < 0:
		raise ValueError("Refilled fuel x_{i,k} must be >= 0")
	if (i, k) not in x_matrix:
		raise KeyError("(i, k) not in refuel matrix")
	x_matrix[(i, k)] = value

def isrefueling(fuel_amount: float) -> int:
	return 1 if fuel_amount >0 else 0

def total_refuel(x_matrix: Dict[tuple, float]) -> float:
	return sum(x_matrix.values())

N = ["n0", "n1", "n2"]  # road sections
H = ["h0", "h1"]         # refuel stations

X = init_refuel_matrix(N, H)
set_refuel(X, "n0", "h0", 10.5)
set_refuel(X, "n1", "h1", 5.0)
print("Refuel matrix:", X)
print("Total refuel:", total_refuel(X))
