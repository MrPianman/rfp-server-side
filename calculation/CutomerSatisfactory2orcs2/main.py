# Customer satisfaction per Eq.(5)/(6) with soft time windows.
from typing import Iterable

def satisfaction(Ti: float, Tei: float, Tli: float, Tri: float, alpha: float = 1.0, beta: float = 1.0) -> float:
	if Ti < Tei:
		# Early: satisfaction decays as Ti moves away from Tei.
		denom = (Tli - Tei)
		if denom <= 0:
			return 0.0
		return max(0.0, ((Tli - Ti) / denom) ** alpha)
	if Tei <= Ti <= Tli:
		# On time within preferred window.=
		return 1.0
	if Tli < Ti <= Tri:
		# Late but within tolerance: decays toward zero at Tri.
		denom = (Tri - Tli)
		if denom <= 0:
			return 0.0
		return max(0.0, ((Tri - Ti) / denom) ** beta)
	# Too late.
	return 0.0


def average_satisfaction(arrivals: Iterable[float], Tei: float, Tli: float, Tri: float, alpha: float = 1.0, beta: float = 1.0) -> float:
	arrivals = list(arrivals)
	if not arrivals:
		return 0.0
	total = sum(satisfaction(t, Tei, Tli, Tri, alpha, beta) for t in arrivals)
	return total / len(arrivals)

Tei, Tli, Tri = 8.0, 10.0, 12.0
arrivals = [8.5, 9.5, 11.5]

print(satisfaction(t, Tei, Tli, Tri, alpha=1.5, beta=2.0) for t in arrivals)
print(average_satisfaction(arrivals, Tei, Tli, Tri, alpha=1.5, beta=2.0))

