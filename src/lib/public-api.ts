/**
 * 브라우저에서 백엔드로 직접 호출할 때 사용하는 절대 URL 조합.
 * HTTPS 페이지(예: Vercel)에서 HTTP 백엔드로 가면 Mixed Content 로 막히므로,
 * 그 경우에는 `/api/upstream/...` 터널을 탄다.
 */
function shouldUseUpstreamTunnel(): boolean {
    if (typeof window === "undefined") return false;
    if (window.location.protocol !== "https:") return false;
    const pub = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    if (!pub || pub.startsWith("https:")) return false;
    if (pub.startsWith("http://localhost") || pub.startsWith("http://127.0.0.1")) return false;
    return pub.startsWith("http://");
}

export function buildPublicApiUrl(path: string): string {
    const p = path.startsWith("/") ? path : `/${path}`;
    if (shouldUseUpstreamTunnel()) {
        return `/api/upstream${p}`;
    }
    const base =
        typeof window === "undefined"
            ? process.env.API_BASE_URL ||
              process.env.NEXT_PUBLIC_API_BASE_URL ||
              "http://localhost:8080"
            : process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    return `${base}${p}`;
}
