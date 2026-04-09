type ServerLogLevel = "error" | "warn" | "info";

/**
 * API Route 등 서버측 한 줄 JSON 로그 — Vercel/호스트 로그 수집에 맞춘 최소 구조
 */
export function serverLog(level: ServerLogLevel, msg: string, meta?: Record<string, unknown>): void {
    const line = JSON.stringify({
        ts: new Date().toISOString(),
        level,
        msg,
        ...meta,
    });
    if (level === "warn") {
        console.warn(line);
    } else if (level === "info") {
        console.log(line);
    } else {
        console.error(line);
    }
}
