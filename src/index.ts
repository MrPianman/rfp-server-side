import { Elysia, t } from "elysia";
import { convertDistanceTextToKm, type TravelMode } from "./lib/distance";

const travelModes: TravelMode[] = ["driving", "walking", "bicycling", "transit"];

class HttpError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "HttpError";
		this.status = status;
	}
}

type DirectionsResponse = {
	status?: string;
	error_message?: string;
	routes?: Array<{
		legs?: Array<{
			distance?: { text?: string };
		}>;
	}>;
};

const fetchDistanceInKm = async (
	originInput: string,
	destinationInput: string,
	mode: TravelMode,
) => {
	const origin = originInput.trim();
	const destination = destinationInput.trim();

	if (!origin) {
		throw new HttpError("origin query parameter is required", 400);
	}

	if (!destination) {
		throw new HttpError("destination query parameter is required", 400);
	}

	const apiKey = Bun.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
	if (!apiKey) {
		throw new HttpError("Missing GOOGLE_MAPS_API_KEY environment variable", 500);
	}

	const directionsUrl = new URL("https://maps.googleapis.com/maps/api/directions/json");
	directionsUrl.searchParams.set("origin", origin);
	directionsUrl.searchParams.set("destination", destination);
	directionsUrl.searchParams.set("mode", mode);
	directionsUrl.searchParams.set("key", apiKey);

	const response = await fetch(directionsUrl);
	if (!response.ok) {
		throw new HttpError(
			`Google Directions request failed with status ${response.status}`,
			502,
		);
	}

	const payload: DirectionsResponse = await response.json();
	if (payload.status && payload.status !== "OK") {
		const statusCode = payload.status === "ZERO_RESULTS" ? 404 : 502;
		const details = payload.error_message ?? payload.status;
		throw new HttpError(`Google Directions error: ${details}`, statusCode);
	}

	const distanceText = payload.routes?.[0]?.legs?.[0]?.distance?.text;
	if (!distanceText) {
		throw new HttpError("No route found", 404);
	}

	const distanceKm = convertDistanceTextToKm(distanceText);

	return {
		origin,
		destination,
		mode,
		distanceKm,
	};
};

const app = new Elysia()
	.onError(({ code, error, set }) => {
		if (code === "VALIDATION") {
			set.status = 400;
			return { error: error.message };
		}

		if (error instanceof HttpError) {
			set.status = error.status;
			return { error: error.message };
		}

		set.status = 500;
		return { error: error instanceof Error ? error.message : "Unknown error" };
	})
	.get(
		"/distance",
		async ({ query, set }) => {
			try {
				const mode = (query.mode ?? "driving").toLowerCase() as TravelMode;
				if (!travelModes.includes(mode)) {
					set.status = 400;
					return { error: `mode must be one of: ${travelModes.join(", ")}` };
				}

				return await fetchDistanceInKm(query.origin, query.destination, mode);
			} catch (err) {
				if (err instanceof HttpError) {
					set.status = err.status;
					return { error: err.message };
				}

				const message = err instanceof Error ? err.message : "Unknown error";
				set.status = 502;
				return { error: message };
			}
		},
		{
			query: t.Object({
				origin: t.String({ minLength: 1 }),
				destination: t.String({ minLength: 1 }),
				mode: t.Optional(
					t.String({ pattern: "^(driving|walking|bicycling|transit)$" }),
				),
			}),
		},
	)
	.listen(Bun.env.PORT ?? process.env.PORT ?? 3000);

const { hostname, port } = app.server ?? { hostname: "localhost", port: 3000 };
console.log(`Elysia server listening on http://${hostname}:${port}`);
