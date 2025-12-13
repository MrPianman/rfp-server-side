from typing import Dict, Final, Iterable
def specific_fuel_cost_per_km(
	p_a_beta: float,
	f_a: float,
	f_u: float,
	e_a_beta_D: float,
	e_T_prime: float,
	q_a_beta: float,
) -> float:
	consumption_per_km: Final = f_a + f_u * e_a_beta_D + e_T_prime * q_a_beta
	if p_a_beta < 0:
		raise ValueError("Fuel price p_{aβ} must be non-negative.")
	if consumption_per_km <= 0:
		raise ValueError("Fuel consumption per km must be positive.")

	return p_a_beta * consumption_per_km

def total_transport_cost(
	section_lengths: Dict[str, float],
	specific_costs: Dict[str, float],
) -> float:
	total = 0.0
	for beta in section_lengths:
		if beta not in specific_costs:
			raise KeyError(f"Missing specific cost for section {beta}")
		length = section_lengths[beta]
		cost_per_km = specific_costs[beta]
		total += length * cost_per_km
	return total

def max_distance_to_first_refuel(
	Q_ind: float,
	Q_B: float,
	f_a: float,
	f_u: float,
	e_a_beta_D: float,
	e_T_prime: float,
	q_a_beta: float,
) -> float:
	numerator: Final = Q_ind - Q_B
	if numerator <= 0:
		raise ValueError("Available fuel (Q_ind - Q_B) must be positive to drive any distance.")

	denominator: Final = f_a + f_u * e_a_beta_D + e_T_prime * q_a_beta
	if denominator <= 0:
		raise ValueError("Fuel consumption per distance must be positive.")

	return numerator / denominator


__all__ = [
	"specific_fuel_cost_per_km",
	"total_transport_cost",
	"max_distance_to_first_refuel",
]
