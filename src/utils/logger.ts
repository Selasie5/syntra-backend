export type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
};

const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

export function log(level: LogLevel, message: string, meta?: any) {
	if (levelOrder[level] < levelOrder[CURRENT_LEVEL]) return;
	const line = JSON.stringify({
		t: new Date().toISOString(),
		level,
		message,
		...(meta ? { meta } : {}),
	});
	// eslint-disable-next-line no-console
	console.log(line);
}

export const logger = {
	debug: (m: string, meta?: any) => log("debug", m, meta),
	info: (m: string, meta?: any) => log("info", m, meta),
	warn: (m: string, meta?: any) => log("warn", m, meta),
	error: (m: string, meta?: any) => log("error", m, meta),
};

export default logger;
