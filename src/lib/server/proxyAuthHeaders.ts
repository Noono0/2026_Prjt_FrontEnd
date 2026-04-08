import type { NextRequest } from "next/server";
import { serverLog } from "@/lib/serverLog";

/**
 * Route Handler에서 Spring API로 프록시할 때, 브라우저가 보낸 세션 쿠키·Authorization 을 그대로 넘긴다.
 * (미전달 시 로그인 상태여도 백엔드는 익명 요청으로 보고 401을 줄 수 있음)
 */
export function proxyAuthHeaders(req: NextRequest): Record<string, string> {
    const out: Record<string, string> = {};
    const cookie = req.headers.get("cookie");
    if (cookie) {
        out.cookie = cookie;
    }
    const authorization = req.headers.get("authorization");
    if (authorization) {
        out.authorization = authorization;
    }
    return out;
}

/** 값 노출 없이 인증 헤더 존재 여부만 (서버 로그 진단용) */
export function proxyAuthDiagnostics(req: NextRequest): Record<string, unknown> {
    const raw = req.headers.get("cookie");
    const hasCookie = Boolean(raw && raw.length > 0);
    const cookieNames = hasCookie
        ? raw!
              .split(";")
              .map((p) => p.trim().split("=")[0])
              .filter((n) => n.length > 0)
        : [];
    const hasJsessionId = cookieNames.some((n) => n.toUpperCase() === "JSESSIONID");
    const authorization = req.headers.get("authorization");
    return {
        incomingHasCookieHeader: hasCookie,
        incomingCookieHeaderLength: raw?.length ?? 0,
        incomingCookieNames: cookieNames,
        incomingHasJsessionIdCookie: hasJsessionId,
        incomingHasAuthorizationHeader: Boolean(authorization && authorization.length > 0),
    };
}

/** 백엔드가 401/403 일 때 Vercel/호스트 로그에 원인 추적용 한 줄 출력 */
export function logBackendProxyAuthFailure(routeLabel: string, req: NextRequest, backendStatus: number): void {
    if (backendStatus !== 401 && backendStatus !== 403) {
        return;
    }
    serverLog("warn", routeLabel, {
        backendStatus,
        ...proxyAuthDiagnostics(req),
    });
}
