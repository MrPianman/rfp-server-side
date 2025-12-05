import { Elysia, t } from "elysia";
import { graphql } from "graphql";
import {
	insertPersonQuery,
	insertVehicleQuery,
	mapPersonRow,
	mapVehicleRow,
	peopleQuery,
	stringifyMarketList,
	vehiclesQuery,
} from "./lib/db";
import {
	optionalTrimmed,
	parseOptionalJSON,
	parseOptionalNumber,
	renderDashboard,
	renderMarketListBuilder,
} from "./lib/dashboard";
import { createGraphQLSchema } from "./lib/graphql";

type GraphQLRequestBody = {
	query: string;
	variables?: Record<string, unknown> | null;
	operationName?: string | null;
};

const schema = createGraphQLSchema();

const vehicleFormSchema = t.Object({
	name: t.String({ minLength: 1 }),
	plate: t.String({ minLength: 1 }),
	status: t.Optional(t.String()),
	speed: t.Optional(t.String()),
	lat: t.Optional(t.String()),
	long: t.Optional(t.String()),
	driver: t.Optional(t.String()),
	note: t.Optional(t.String()),
	marketList: t.Optional(t.String()),
});

const personFormSchema = t.Object({
	name: t.String({ minLength: 1 }),
	phone: t.Optional(t.String()),
	status: t.Optional(t.String()),
});

const graphqlBodySchema = t.Object({
	query: t.String({ minLength: 1 }),
	variables: t.Optional(t.Record(t.String(), t.Unknown())),
	operationName: t.Optional(t.String({ minLength: 1 })),
});

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
	.get("/", ({ set }) => {
		try {
			const vehicles = vehiclesQuery.all().map(mapVehicleRow);
			const people = peopleQuery.all().map(mapPersonRow);
			set.headers["content-type"] = "text/html; charset=utf-8";
			return renderDashboard(vehicles, people);
		} catch (err) {
			set.status = 500;
			return err instanceof Error ? err.message : "Unable to load dashboard";
		}
	})
	.get("/market-list", ({ set }) => {
		set.headers["content-type"] = "text/html; charset=utf-8";
		return renderMarketListBuilder();
	})
	.post(
		"/vehicles",
		({ body, set }) => {
			try {
				const name = body.name.trim();
				const plate = body.plate.trim();
				const status = optionalTrimmed(body.status);
				const speed = parseOptionalNumber(body.speed);
				const lat = parseOptionalNumber(body.lat);
				const longValue = parseOptionalNumber(body.long);
				const driver = optionalTrimmed(body.driver);
				const note = optionalTrimmed(body.note);
				const marketListParsed = parseOptionalJSON(body.marketList);
				const marketListSerialized = stringifyMarketList(marketListParsed);

				insertVehicleQuery.get(
					name,
					status,
					plate,
					speed,
					lat,
					longValue,
					driver,
					note,
					marketListSerialized,
				);
				set.status = 303;
				set.headers.location = "/";
				return "See Other";
			} catch (err) {
				set.status = 400;
				return err instanceof Error ? err.message : "Unable to save vehicle";
			}
		},
		{ body: vehicleFormSchema },
	)
	.post(
		"/people",
		({ body, set }) => {
			try {
				const name = body.name.trim();
				const phone = optionalTrimmed(body.phone);
				const status = optionalTrimmed(body.status);

				insertPersonQuery.get(name, phone, status);
				set.status = 303;
				set.headers.location = "/";
				return "See Other";
			} catch (err) {
				set.status = 400;
				return err instanceof Error ? err.message : "Unable to save person";
			}
		},
		{ body: personFormSchema },
	)
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
		{ body: graphqlBodySchema },
	)
	.listen(Bun.env.PORT ?? process.env.PORT ?? 8000);

const { hostname, port } = app.server ?? { hostname: "localhost", port: 8000 };
console.log(`Elysia server listening on http://${hostname}:${port}`);
