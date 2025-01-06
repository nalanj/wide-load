import { DuckDBInstance, timestampValue } from "@duckdb/node-api";

const schema = `
		CREATE TABLE IF NOT EXISTS wide_events (
			at TIMESTAMPTZ,
			svc TEXT,
			name TEXT,
			attrs JSON
		);
`;

export async function dbInit() {
	const db = await DuckDBInstance.create("wide.db");
	const conn = await db.connect();

	await conn.run(schema);

	const appender = await conn.createAppender("main", "wide_events");

	return [
		async (logMsg) => {
			const { at, svc, name, ...attrs } = logMsg;

			appender.appendTimestamp(timestampValue(BigInt(at.getTime()) * 1000n));
			appender.appendVarchar(svc);
			appender.appendVarchar(name);
			appender.appendVarchar(JSON.stringify(attrs));
			appender.endRow();
		},
		async () => {
			appender.close();
			conn.close();
		},
	];
}
