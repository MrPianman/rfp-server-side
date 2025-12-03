# Google Maps Distance helper

Expose a `/distance` HTTP endpoint with [Bun](https://bun.sh/) and [Elysia](https://elysiajs.com/) that mirrors a Google Apps Script helper by fetching Google Maps Directions data and returning the route distance in kilometers.

## Prerequisites
- [Bun](https://bun.sh/docs/installation)
- A Google Maps Directions API key with the Directions API enabled

## Setup
1. Install dependencies (already present in `node_modules`, but safe to re-run):
	```bash
	bun install
	```
2. Copy the environment template and add your Google API key:
	```bash
	cp .env.example .env
	# edit .env to set GOOGLE_MAPS_API_KEY=...
	```
3. (Optional) Change `PORT` in `.env` if you do not want to use the default `3000`.

## Development
Start the dev server with hot reload:
```bash
bun run dev
```

The server logs the resolved host/port on boot. Once running you can call the helper:
```bash
curl "http://localhost:3000/distance?origin=New+York,NY&destination=Boston,MA&mode=driving"
```

### Query parameters
- `origin` (required): any value Google Maps can geocode
- `destination` (required)
- `mode` (optional): one of `driving`, `walking`, `bicycling`, `transit` (defaults to `driving`)

### Responses
Successful calls return:
```json
{
  "origin": "New York, NY",
  "destination": "Boston, MA",
  "mode": "driving",
  "distanceKm": 346.57
}
```

Validation errors or upstream failures respond with `{ "error": "message" }` and a descriptive HTTP status (400 for bad input, 404 when Google cannot find a route, 5xx for internal or upstream issues).

## Testing
Run the Bun test suite (covers the distance parsing helpers) with:
```bash
bun test
```