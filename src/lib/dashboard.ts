import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Person, Vehicle } from "./db";

const dashboardTemplatePath = fileURLToPath(new URL("../templates/dashboard.html", import.meta.url));
const marketListTemplatePath = fileURLToPath(new URL("../templates/market-list.html", import.meta.url));

const loadTemplate = (path: string) => readFileSync(path, "utf8");

const escapeHtml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

const renderTable = <T,>(
	rows: T[],
	columns: Array<{ header: string; cell: (row: T) => string }>,
) => {
	if (!rows.length) {
		return `<tr><td colspan="${columns.length}" class="empty">No data available</td></tr>`;
	}

	return rows
		.map((row) => {
			const cells = columns.map((column) => `<td>${column.cell(row)}</td>`).join("");
			return `<tr>${cells}</tr>`;
		})
		.join("");
};

export const renderDashboard = (vehicles: Vehicle[], people: Person[]) => {
	const vehicleColumns: Array<{ header: string; cell: (row: Vehicle) => string }> = [
		{ header: "ID", cell: (row) => escapeHtml(String(row.id)) },
		{ header: "Name", cell: (row) => escapeHtml(row.name) },
		{ header: "Status", cell: (row) => escapeHtml(row.status ?? "") },
		{ header: "Plate", cell: (row) => escapeHtml(row.plate) },
		{ header: "Speed", cell: (row) => escapeHtml(row.speed?.toString() ?? "") },
		{ header: "Lat", cell: (row) => escapeHtml(row.lat?.toString() ?? "") },
		{ header: "Long", cell: (row) => escapeHtml(row.long?.toString() ?? "") },
		{ header: "Driver", cell: (row) => escapeHtml(row.driver ?? "") },
		{ header: "Note", cell: (row) => escapeHtml(row.note ?? "") },
		{
			header: "Market List",
			cell: (row) => escapeHtml(row.marketList == null ? "" : JSON.stringify(row.marketList)),
		},
	];

	const peopleColumns: Array<{ header: string; cell: (row: Person) => string }> = [
		{ header: "ID", cell: (row) => escapeHtml(String(row.id)) },
		{ header: "Name", cell: (row) => escapeHtml(row.name) },
		{ header: "Phone", cell: (row) => escapeHtml(row.phone ?? "") },
		{ header: "Status", cell: (row) => escapeHtml(row.status ?? "") },
	];

	const template = loadTemplate(dashboardTemplatePath);
	const vehicleHeaders = vehicleColumns.map((column) => `<th>${column.header}</th>`).join("");
	const peopleHeaders = peopleColumns.map((column) => `<th>${column.header}</th>`).join("");

	return template
		.replace("{{VEHICLE_HEADERS}}", vehicleHeaders)
		.replace("{{VEHICLE_ROWS}}", renderTable(vehicles, vehicleColumns))
		.replace("{{PEOPLE_HEADERS}}", peopleHeaders)
		.replace("{{PEOPLE_ROWS}}", renderTable(people, peopleColumns));
};

export const renderMarketListBuilder = () => loadTemplate(marketListTemplatePath);

export const optionalTrimmed = (value: string | null | undefined) => {
	if (value == null) {
		return null;
	}

	const trimmed = value.trim();
	return trimmed === "" ? null : trimmed;
};

export const parseOptionalNumber = (value: string | null | undefined) => {
	if (value == null || value.trim() === "") {
		return null;
	}

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

export const parseOptionalJSON = (value: string | null | undefined) => {
	if (value == null || value.trim() === "") {
		return null;
	}

	return JSON.parse(value);
};
