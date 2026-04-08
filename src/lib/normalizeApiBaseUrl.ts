/** 스프링 API 베이스 URL — 끝 슬래시 제거, 공백이면 localhost 폴백 */
export function normalizeApiBaseUrl(raw: string): string {
    const s = raw.trim().replace(/\/+$/, "");
    return s || "http://localhost:8080";
}
