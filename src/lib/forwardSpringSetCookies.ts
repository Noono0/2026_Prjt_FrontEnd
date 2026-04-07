import type { NextResponse } from "next/server";

/** Spring → Next API Route 응답의 Set-Cookie 를 브라우저로 그대로 넘김. get("set-cookie")는 Node fetch에서 null일 수 있음. */
export function forwardSpringSetCookies(from: Response, to: NextResponse): void {
    const multi = typeof from.headers.getSetCookie === "function" ? from.headers.getSetCookie() : [];
    if (multi.length > 0) {
        for (const c of multi) {
            to.headers.append("Set-Cookie", c);
        }
        return;
    }
    const single = from.headers.get("set-cookie");
    if (single) {
        to.headers.append("Set-Cookie", single);
    }
}
