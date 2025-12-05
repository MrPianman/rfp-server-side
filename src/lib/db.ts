import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type VehicleRow = {
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

export type PersonRow = {
	ID: number;
	Name: string;
	Phone: string | null;
	Status: string | null;
};

export type Vehicle = {
	id: number;
	name: string;
	status: string | null;
	plate: string;
	speed: number | null;
	lat: number | null;
	long: number | null;
	driver: string | null;
	note: string | null;
	marketList: unknown | null;
};

export type Person = {
	id: number;
	name: string;
	phone: string | null;
	status: string | null;
};

const defaultDbPath = fileURLToPath(new URL("../../niggers67.db", import.meta.url));
const providedDbPath = Bun.env.SQLITE_DB_PATH ?? process.env.SQLITE_DB_PATH;
const dbPath = providedDbPath ? resolve(providedDbPath) : defaultDbPath;

if (!existsSync(dbPath)) {
	throw new Error(`SQLite database not found at ${dbPath}`);
}

export const db = new Database(dbPath);

export const parseMarketList = (raw: string | null) => {
	if (raw == null || raw.trim() === "") {
		return null;
	}

	try {
		return JSON.parse(raw);
	} catch {
		throw new Error("MarketList column contains invalid JSON");
	}
};

export const stringifyMarketList = (value: unknown) => {
	try {
		return JSON.stringify(value ?? null);
	} catch {
		throw new Error("marketList must be JSON serializable");
	}
};

export const mapVehicleRow = (row: VehicleRow): Vehicle => ({
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

export const mapPersonRow = (row: PersonRow): Person => ({
	id: row.ID,
	name: row.Name,
	phone: row.Phone,
	status: row.Status,
});

export const vehiclesQuery = db.query<VehicleRow, []>(
	`SELECT ID, Name, Status, Plate, Speed, Lat, Long, Driver, Note, MarketList FROM vehicle`,
);

export const vehiclesByStatusQuery = db.query<VehicleRow, [string | null]>(
	`SELECT ID, Name, Status, Plate, Speed, Lat, Long, Driver, Note, MarketList FROM vehicle WHERE Status = ?1`,
);

export const vehicleByIdQuery = db.query<VehicleRow, [number]>(
	`SELECT ID, Name, Status, Plate, Speed, Lat, Long, Driver, Note, MarketList FROM vehicle WHERE ID = ?1`,
);

export const peopleQuery = db.query<PersonRow, []>(
	`SELECT ID, Name, Phone, Status FROM People`,
);

export const peopleByStatusQuery = db.query<PersonRow, [string | null]>(
	`SELECT ID, Name, Phone, Status FROM People WHERE Status = ?1`,
);

export const updateMarketListQuery = db.query<void, [string, number]>(
	`UPDATE vehicle SET MarketList = ?1 WHERE ID = ?2`,
);

export const insertVehicleQuery = db.query<
	VehicleRow,
	[
		string,
		string | null,
		string,
		number | null,
		number | null,
		number | null,
		string | null,
		string | null,
		string | null,
	]
>(
	`INSERT INTO vehicle (Name, Status, Plate, Speed, Lat, Long, Driver, Note, MarketList)
	VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
	RETURNING ID, Name, Status, Plate, Speed, Lat, Long, Driver, Note, MarketList`,
);

export const insertPersonQuery = db.query<PersonRow, [string, string | null, string | null]>(
	`INSERT INTO People (Name, Phone, Status)
	VALUES (?1, ?2, ?3)
	RETURNING ID, Name, Phone, Status`,
);
