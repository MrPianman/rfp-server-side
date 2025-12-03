# Fleet GraphQL API

Serve live vehicle and personnel data from a local SQLite database through a GraphQL endpoint powered by [Bun](https://bun.sh/) and [Elysia](https://elysiajs.com/).

## Prerequisites
- [Bun](https://bun.sh/docs/installation)
- A SQLite database that follows `schema.sql` (tables `vehicle` and `People`)

## Setup
1. Install dependencies:
	```bash
	bun install
	```
2. Copy the environment template and point the server at your SQLite file (defaults to the bundled `niggers67.db` if unset):
	```bash
	cp .env.example .env
	# edit .env to set SQLITE_DB_PATH=/absolute/path/to/your.db
	```
3. (Optional) Set `PORT` if you need something other than `3000`.

## Development
Start the dev server with hot reload:
```bash
bun run dev
```

Then issue GraphQL requests to `POST /graphql`:

```bash
curl -X POST http://localhost:3000/graphql \
	-H "Content-Type: application/json" \
	-d '{
		"query": "query Vehicles($status: String) { vehicles(status: $status) { id name status plate speed lat long driver note marketList } }",
		"variables": { "status": "ACTIVE" }
	}'
```

You can also fetch a single vehicle or list of people:

```graphql
query FleetSnapshot {
	vehicle(id: "1") {
		name
		plate
		speed
		marketList
	}
	people(status: "ON_DUTY") {
		id
		name
		phone
	}
}
```

Update a vehicle's `marketList` (always stored as JSON in SQLite, so the mutation only accepts valid JSON payloads):

```graphql
mutation UpdateList($id: ID!, $payload: JSON!) {
	updateVehicleMarketList(id: $id, marketList: $payload) {
		id
		marketList
	}
}
```

### GraphQL schema (excerpt)

```graphql
scalar JSON

type Vehicle {
	id: ID!
	name: String!
	status: String
	plate: String!
	speed: Float
	lat: Float
	long: Float
	driver: String
	note: String
	marketList: String
}

type Person {
	id: ID!
	name: String!
	phone: String
	status: String
}

type Query {
	vehicles(status: String): [Vehicle!]!
	vehicle(id: ID!): Vehicle
	people(status: String): [Person!]!
}

type Mutation {
	updateVehicleMarketList(id: ID!, marketList: JSON!): Vehicle
}
```

All errors are reported through the GraphQL `errors` array, and the HTTP status mirrors the most relevant issue (for example, `400` for invalid IDs or malformed JSON, `404` when a vehicle is missing, `500` for database problems).

## Testing
Run the Bun test suite (currently covers shared helpers) with:
```bash
bun test
```