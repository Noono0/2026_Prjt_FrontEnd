import type { NextRequest } from "next/server";

/** Next API Route → Spring 으로 요청할 때, 브라우저 세션(JSESSIONID 등)을 그대로 넘김 */
export function springProxyHeaders(req: NextRequest, init?: HeadersInit): Headers {
    const h = new Headers(init);
    const cookie = req.headers.get("cookie");
    if (cookie) h.set("cookie", cookie);
    const authorization = req.headers.get("authorization");
    if (authorization) h.set("authorization", authorization);
    return h;
}
