import type { NextRequest } from "next/server";

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
