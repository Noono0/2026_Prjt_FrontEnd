import { defaultApiRequestInit } from "@/lib/http/requestInit";

/**
 * Springdoc가 넣는 절대 URL(예: http://127.0.0.1:8080/...)을
 * Next BFF로 프록시되는 상대 경로(`/api/...`)로 바꿉니다.
 */
function toRelativeRequestUrl(url: string): string {
    if (url.startsWith("/")) {
        return url;
    }
    try {
        const parsed = new URL(url);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return url;
    }
}

type ErrorWithInfo = Error & { info?: unknown; status?: number };

/**
 * Orval fetch 클라이언트용 mutator. 세션 쿠키 전송은 `defaultApiRequestInit`과 동일합니다.
 */
export async function customFetch<T>(url: string, init?: RequestInit): Promise<T> {
    const targetUrl = toRelativeRequestUrl(url);
    const res = await fetch(targetUrl, {
        ...defaultApiRequestInit,
        ...init,
    });

    const body = res.status === 204 || res.status === 205 || res.status === 304 ? null : await res.text();

    if (!res.ok) {
        const err = new Error(res.statusText) as ErrorWithInfo;
        err.status = res.status;
        if (body) {
            try {
                err.info = JSON.parse(body) as unknown;
            } catch {
                err.info = body;
            }
        } else {
            err.info = {};
        }
        throw err;
    }

    return (body ? (JSON.parse(body) as T) : ({} as T)) as T;
}
