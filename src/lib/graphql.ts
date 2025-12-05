import {
	GraphQLEnumType,
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
} from "graphql";
import {
	mapPersonRow,
	mapVehicleRow,
	peopleByStatusQuery,
	peopleQuery,
	stringifyMarketList,
	updateMarketListQuery,
	vehicleByIdQuery,
	vehiclesByStatusQuery,
	vehiclesQuery,
} from "./db";
import { fetchRouteMetrics } from "./googleMaps";
import type { TravelMode } from "./distance";

const createJsonScalar = () =>
	new GraphQLScalarType({
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

export const createGraphQLSchema = () => {
	const GraphQLJSON = createJsonScalar();

	const travelModeEnum = new GraphQLEnumType({
		name: "TravelMode",
		values: {
			DRIVING: { value: "driving" },
			WALKING: { value: "walking" },
			BICYCLING: { value: "bicycling" },
			TRANSIT: { value: "transit" },
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

	const routeMetricsType = new GraphQLObjectType({
		name: "RouteMetrics",
		fields: () => ({
			origin: { type: new GraphQLNonNull(GraphQLString) },
			destination: { type: new GraphQLNonNull(GraphQLString) },
			mode: { type: new GraphQLNonNull(travelModeEnum) },
			distanceText: { type: new GraphQLNonNull(GraphQLString) },
			distanceKm: { type: new GraphQLNonNull(GraphQLFloat) },
			durationText: { type: new GraphQLNonNull(GraphQLString) },
			durationSeconds: { type: new GraphQLNonNull(GraphQLFloat) },
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
			routeMetrics: {
				type: new GraphQLNonNull(routeMetricsType),
				args: {
					origin: { type: new GraphQLNonNull(GraphQLString) },
					destination: { type: new GraphQLNonNull(GraphQLString) },
					mode: { type: travelModeEnum, defaultValue: "driving" },
				},
				resolve: async (
					_source,
					args: { origin: string; destination: string; mode?: TravelMode },
				) => {
					try {
						return await fetchRouteMetrics(
							args.origin,
							args.destination,
							args.mode ?? "driving",
						);
					} catch (err) {
						throw new GraphQLError(
							err instanceof Error ? err.message : "Unable to fetch route",
							{ extensions: { http: { status: 502 } } },
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

	return new GraphQLSchema({ query: queryType, mutation: mutationType });
};
