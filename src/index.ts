import { Database } from "bun:sqlite";
import { Elysia, t } from "elysia";
import {
	GraphQLError,
	GraphQLFloat,
	GraphQLID,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLScalarType,
	GraphQLSchema,
	GraphQLString,
	Kind,
	graphql,
} from "graphql";

type GraphQLRequestBody = {
	query: string;
	variables?: Record<string, unknown> | null;
	operationName?: string | null;
};
type VehicleRow = {
	ID: number;
	Name: string;
	Status: string | null;
	Plate: string;
	Speed: number | null;
	Lat: number | null;
	Long: number | null;
	Driver: string | null;
	Note: string | null;
	MarketList: string | null;
};

type PersonRow = {
	ID: number;
	Name: string;
	Phone: string | null;
	Status: string | null;
};

const dbPath =
	Bun.env.SQLITE_DB_PATH ?? process.env.SQLITE_DB_PATH ?? "./niggers67.db";
const indexHtmlUrl = new URL("./index.html", import.meta.url);

let db: Database;
try {
	db = new Database(dbPath, { create: false });
} catch (err) {
	console.error(`Unable to open SQLite database at ${dbPath}`);
	throw err;
}

const parseMarketList = (raw: string | null) => {
	if (raw == null || raw.trim() === "") {
		return null;
	}

	try {
		return JSON.parse(raw);
	} catch {
		throw new Error("MarketList column contains invalid JSON");
	}
};

const stringifyMarketList = (value: unknown) => {
	try {
		return JSON.stringify(value ?? null);
	} catch {
		throw new Error("marketList must be JSON serializable");
	}
};

const mapVehicleRow = (row: VehicleRow) => ({
	id: row.ID,
	name: row.Name,
	status: row.Status,
	plate: row.Plate,
	speed: row.Speed,
	lat: row.Lat,
	long: row.Long,
	driver: row.Driver,
	note: row.Note,
	marketList: parseMarketList(row.MarketList),
});

const mapPersonRow = (row: PersonRow) => ({
	id: row.ID,
	name: row.Name,
	phone: row.Phone,
	status: row.Status,
});

const vehiclesQuery = db.query<VehicleRow, []>(
	`SELECT ID, Name, Status, Plate, Speed, Lat, Long, Driver, Note, MarketList FROM vehicle`,
);

const vehiclesByStatusQuery = db.query<VehicleRow, [string | null]>(
	`SELECT ID, Name, Status, Plate, Speed, Lat, Long, Driver, Note, MarketList FROM vehicle WHERE Status = ?1`,
);

const vehicleByIdQuery = db.query<VehicleRow, [number]>(
	`SELECT ID, Name, Status, Plate, Speed, Lat, Long, Driver, Note, MarketList FROM vehicle WHERE ID = ?1`,
);

const peopleQuery = db.query<PersonRow, []>(
	`SELECT ID, Name, Phone, Status FROM People`,
);

const peopleByStatusQuery = db.query<PersonRow, [string | null]>(
	`SELECT ID, Name, Phone, Status FROM People WHERE Status = ?1`,
);

const updateMarketListQuery = db.query<void, [string, number]>(
	`UPDATE vehicle SET MarketList = ?1 WHERE ID = ?2`,
);

const GraphQLJSON = new GraphQLScalarType({
	name: "JSON",
	description: "Arbitrary JSON value",
	serialize: (value) => value,
	parseValue: (value) => value,
	parseLiteral: (ast) => {
		const parseNode = (node: typeof ast): unknown => {
			switch (node.kind) {
				case Kind.STRING:
				case Kind.BOOLEAN:
					return node.value;
				case Kind.INT:
					return parseInt(node.value, 10);
				case Kind.FLOAT:
					return parseFloat(node.value);
				case Kind.NULL:
					return null;
				case Kind.LIST:
					return node.values.map(parseNode);
				case Kind.OBJECT:
					return Object.fromEntries(
						node.fields.map((field) => [field.name.value, parseNode(field.value)]),
					);
				default:
					return null;
			}
		};

		return parseNode(ast);
	},
});

const vehicleType = new GraphQLObjectType({
	name: "Vehicle",
	fields: () => ({
		id: { type: new GraphQLNonNull(GraphQLID) },
		name: { type: new GraphQLNonNull(GraphQLString) },
		status: { type: GraphQLString },
		plate: { type: new GraphQLNonNull(GraphQLString) },
		speed: { type: GraphQLFloat },
		lat: { type: GraphQLFloat },
		long: { type: GraphQLFloat },
		driver: { type: GraphQLString },
		note: { type: GraphQLString },
		marketList: { type: GraphQLJSON },
	}),
});

const personType = new GraphQLObjectType({
	name: "Person",
	fields: () => ({
		id: { type: new GraphQLNonNull(GraphQLID) },
		name: { type: new GraphQLNonNull(GraphQLString) },
		phone: { type: GraphQLString },
		status: { type: GraphQLString },
	}),
});

const queryType = new GraphQLObjectType({
	name: "Query",
	fields: () => ({
		vehicles: {
			type: new GraphQLNonNull(
				new GraphQLList(new GraphQLNonNull(vehicleType)),
			),
			args: {
				status: { type: GraphQLString },
			},
			resolve: (_source, args: { status?: string | null }) => {
				try {
					const rows = args.status
						? vehiclesByStatusQuery.all(args.status)
						: vehiclesQuery.all();
					return rows.map(mapVehicleRow);
				} catch (err) {
					throw new GraphQLError(
						err instanceof Error ? err.message : "Unknown database error",
						{ extensions: { http: { status: 500 } } },
					);
				}
			},
		},
		vehicle: {
			type: vehicleType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLID) },
			},
			resolve: (_source, args: { id: string }) => {
				const numericId = Number(args.id);
				if (Number.isNaN(numericId)) {
					throw new GraphQLError("id must be a number", {
						extensions: { http: { status: 400 } },
					});
				}

				const row = vehicleByIdQuery.get(numericId);
				if (!row) {
					throw new GraphQLError("Vehicle not found", {
						extensions: { http: { status: 404 } },
					});
				}

				return mapVehicleRow(row);
			},
		},
		people: {
			type: new GraphQLNonNull(
				new GraphQLList(new GraphQLNonNull(personType)),
			),
			args: {
				status: { type: GraphQLString },
			},
			resolve: (_source, args: { status?: string | null }) => {
				try {
					const rows = args.status
						? peopleByStatusQuery.all(args.status)
						: peopleQuery.all();
					return rows.map(mapPersonRow);
				} catch (err) {
					throw new GraphQLError(
						err instanceof Error ? err.message : "Unknown database error",
						{ extensions: { http: { status: 500 } } },
					);
				}
			},
		},
	}),
});

const mutationType = new GraphQLObjectType({
	name: "Mutation",
	fields: () => ({
		updateVehicleMarketList: {
			type: vehicleType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLID) },
				marketList: { type: new GraphQLNonNull(GraphQLJSON) },
			},
			resolve: (_source, args: { id: string; marketList: unknown }) => {
				const numericId = Number(args.id);
				if (Number.isNaN(numericId)) {
					throw new GraphQLError("id must be a number", {
						extensions: { http: { status: 400 } },
					});
				}

				let serialized: string;
				try {
					serialized = stringifyMarketList(args.marketList);
				} catch (err) {
					throw new GraphQLError(
						err instanceof Error ? err.message : "Invalid marketList JSON",
						{ extensions: { http: { status: 400 } } },
					);
				}
				const info = updateMarketListQuery.run(serialized, numericId);
				if (info.changes === 0) {
					throw new GraphQLError("Vehicle not found", {
						extensions: { http: { status: 404 } },
					});
				}

				const row = vehicleByIdQuery.get(numericId);
				if (!row) {
					throw new GraphQLError("Vehicle not found", {
						extensions: { http: { status: 404 } },
					});
				}

				return mapVehicleRow(row);
			},
		},
	}),
});

const schema = new GraphQLSchema({ query: queryType, mutation: mutationType });

const app = new Elysia()
	.onError(({ code, error, set }) => {
		const message = error instanceof Error ? error.message : "Unknown error";

		if (code === "VALIDATION") {
			set.status = 400;
			return { error: message };
		}

		set.status = 500;
		return { error: message };
	})
	.get("/", () => Bun.file(indexHtmlUrl))
	.post(
		"/graphql",
		async ({ body, set }) => {
			const graphqlBody = body as GraphQLRequestBody;
			const result = await graphql({
				schema,
				source: graphqlBody.query,
				variableValues: graphqlBody.variables ?? undefined,
				operationName: graphqlBody.operationName ?? undefined,
			});

			const statusFromErrors = result.errors
				?.map((err) => {
					const extension = err.extensions?.http as { status?: number } | undefined;
					return extension?.status;
				})
				.find((status): status is number => typeof status === "number");

			set.status = statusFromErrors ?? 200;
			set.headers["content-type"] = "application/json";
			return result;
		},
		{
			body: t.Object({
				query: t.String({ minLength: 1 }),
				variables: t.Optional(t.Record(t.String(), t.Unknown())),
				operationName: t.Optional(t.String({ minLength: 1 })),
			}),
		},
	)
	.listen(Bun.env.PORT ?? process.env.PORT ?? 3000);

const { hostname, port } = app.server ?? { hostname: "localhost", port: 3000 };
console.log(`Elysia server listening on http://${hostname}:${port}`);
