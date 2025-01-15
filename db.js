import { DuckDBInstance, timestampValue } from "@duckdb/node-api";

const schema = `
	CREATE TABLE IF NOT EXISTS wide_events (
		at TIMESTAMPTZ,
		year INT,
		month INT,
		day INT,
		hour INT,
		svc TEXT,
		name TEXT,
		attrs JSON
	);
`;

const dbSetup = `
	CREATE SECRET s3secret (
    TYPE S3,
    KEY_ID 'minio',
    SECRET 'miniominio',
    REGION 'us-east-1',
    USE_SSL false,
    URL_STYLE 'path',
    ENDPOINT 'localhost:31008'
	);

	INSTALL httpfs;
	LOAD httpfs;
`;

export async function dbInit() {
	const db = await DuckDBInstance.create();
	const conn = await db.connect();

	await conn.run(dbSetup);
	await conn.run(schema);

	const appender = await conn.createAppender("main", "wide_events");

	let rowCount = 0;

	return [
		async (logMsg) => {
			const { at, svc, name, ...attrs } = logMsg;

			appender.appendTimestamp(timestampValue(BigInt(at.getTime()) * 1000n));
			appender.appendInteger(at.getUTCFullYear());
			appender.appendInteger(at.getUTCMonth() + 1);
			appender.appendInteger(at.getUTCDate());
			appender.appendInteger(at.getUTCHours());
			appender.appendVarchar(svc);
			appender.appendVarchar(name);
			appender.appendVarchar(JSON.stringify(attrs));
			appender.endRow();

			rowCount++;

			if (rowCount >= 10000) {
				appender.flush();
				await flush(conn);
				rowCount = 0;
			}
		},

		async () => {
			appender.close();
			await flush(conn);
			conn.close();
		},
	];
}

async function flush(conn) {
	await conn.run("BEGIN TRANSACTION;");
	await conn.run(
		"COPY wide_events TO 's3://wide-events/data' (FORMAT PARQUET, APPEND true, PARTITION_BY( year, month, day, hour, svc ));",
	);
	await conn.run("DELETE FROM wide_events;");
	await conn.run("COMMIT;");
}
