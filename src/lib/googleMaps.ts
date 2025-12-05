import { convertDistanceTextToKm, TravelMode } from "./distance";

export type RouteMetrics = {
	origin: string;
	destination: string;
	mode: TravelMode;
	distanceText: string;
	distanceKm: number;
	durationText: string;
	durationSeconds: number;
};

const GOOGLE_DIRECTIONS_ENDPOINT = "https://maps.googleapis.com/maps/api/directions/json";

const resolveApiKey = () => {
	const key = Bun.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
	if (!key) {
		throw new Error("GOOGLE_MAPS_API_KEY is not configured");
	}

	return key;
};

export const fetchRouteMetrics = async (
	origin: string,
	destination: string,
	mode: TravelMode = "driving",
): Promise<RouteMetrics> => {
	if (!origin.trim()) {
		throw new Error("origin is required");
	}

	if (!destination.trim()) {
		throw new Error("destination is required");
	}

	const apiKey = resolveApiKey();
	const params = new URLSearchParams({
		origin,
		destination,
		mode,
		key: apiKey,
	});

	const response = await fetch(`${GOOGLE_DIRECTIONS_ENDPOINT}?${params.toString()}`);
	if (!response.ok) {
		throw new Error(`Google Directions error: ${response.status} ${response.statusText}`);
	}

	type Leg = {
		distance?: { text?: string; value?: number };
		duration?: { text?: string; value?: number };
	};

	const payload: {
		status?: string;
		error_message?: string;
		routes?: Array<{ legs?: Leg[] }>;
	} = await response.json();

	if (payload.status !== "OK") {
		throw new Error(
			payload.error_message ?? payload.status ?? "Unknown response from Google Directions",
		);
	}

	const leg = payload.routes?.[0]?.legs?.[0];
	if (!leg) {
		throw new Error("No route found");
	}

	const distanceMeters = leg.distance?.value;
	const distanceText = leg.distance?.text ?? "";
	const durationSeconds = leg.duration?.value;
	const durationText = leg.duration?.text ?? "";

	if (typeof distanceMeters !== "number" && !distanceText) {
		throw new Error("Unable to read distance from Google response");
	}

	if (typeof durationSeconds !== "number" && !durationText) {
		throw new Error("Unable to read duration from Google response");
	}

	const distanceKm = typeof distanceMeters === "number"
		? distanceMeters / 1000
		: convertDistanceTextToKm(distanceText);

	return {
		origin,
		destination,
		mode,
		distanceText: distanceText || `${distanceKm.toFixed(2)} km`,
		distanceKm,
		durationText: durationText || `${durationSeconds} sec`,
		durationSeconds: durationSeconds ?? 0,
	};
};
