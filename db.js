import { DuckDBInstance, timestampValue } from "@duckdb/node-api";

const schema = `
	CREATE TABLE IF NOT EXISTS wide_events (
		id BIGINT,
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

export async function dbInit(batchSize) {
	const db = await DuckDBInstance.create();
	const conn = await db.connect();

	await conn.run(dbSetup);
	await conn.run(schema);

	const appender = await conn.createAppender("main", "wide_events");

	let rowCount = 0n;
	let rowId = 0n;

	return [
		async (logMsg) => {
			const { at, svc, name, ...attrs } = logMsg;

			appender.appendBigInt(rowId);
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
			rowId++;

			if (rowCount >= batchSize) {
				appender.flush();
				const deleted = await flush(conn, batchSize);
				rowCount -= deleted;
			}
		},

		async () => {
			appender.close();
			await flush(conn, batchSize, true);
			conn.close();
		},
	];
}

async function flush(conn, batchSize, closing = false) {
	let deleted = 0n;

	const reader = await conn.runAndReadAll(`
		SELECT MAX(id), COUNT(*), year, month, day, hour, svc
		FROM wide_events 
		GROUP BY year, month, day, hour, svc
		ORDER BY year, month, day, hour, svc;
	`);
	const rows = reader.getRows();

	for (let i = 0; i < rows.length; i++) {
		const [maxId, count, year, month, day, hour, svc] = rows[i];
		if (i < rows.length - 1 || count >= batchSize || closing) {
			await conn.run("BEGIN TRANSACTION;");

			const key = [...Array(30)]
				.map(() => Math.random().toString(36)[2])
				.join("");

			const s3Path = `s3://wide-events/data/year=${year}/month=${month}/day=${day}/hour=${hour}/svc=${svc}/${key}.parquet`;
			await conn.run(
				`COPY (SELECT year, month, day, hour, svc, at, name, attrs FROM wide_events) TO '${s3Path}' (FORMAT PARQUET);`,
			);

			const deleteQuery = await conn.prepare(
				"DELETE FROM wide_events WHERE id <= $1 AND year = $2 AND month = $3 AND day = $4 AND hour = $5;",
			);
			deleteQuery.bindBigInt(1, maxId);
			deleteQuery.bindInteger(2, year);
			deleteQuery.bindInteger(3, month);
			deleteQuery.bindInteger(4, day);
			deleteQuery.bindInteger(5, hour);
			await deleteQuery.run();

			await conn.run("COMMIT;");

			deleted += count;
		}
	}

	return deleted;
}
