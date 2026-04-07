import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { API_BASE_URL } from "@/lib/config";

/**
 * NextAuth(JWT)에 올라간 memberId·memberSeq 로 Spring JSESSIONID 를 맞춥니다.
 * 브라우저는 Secret 을 모릅니다 — 서버에서만 백엔드 호출.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const memberId = session?.user?.memberId;
        const memberSeq = session?.user?.memberSeq;
        if (!memberId || memberSeq == null) {
            return NextResponse.json(
                { success: false, message: "NextAuth 세션에 회원 연동 정보가 없습니다." },
                { status: 401 }
            );
        }

        const secret = process.env.OAUTH_SYNC_SECRET;
        if (!secret) {
            return NextResponse.json(
                { success: false, message: "OAUTH_SYNC_SECRET 미설정" },
                { status: 500 }
            );
        }

        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/auth/oauth/establish-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-OAuth-Sync-Secret": secret,
                ...(cookie ? { cookie } : {}),
            },
            body: JSON.stringify({ memberId, memberSeq }),
            cache: "no-store",
        });

        const data = await res.json();
        const response = NextResponse.json(data, { status: res.status });
        const multi = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
        if (multi.length > 0) {
            for (const c of multi) {
                response.headers.append("Set-Cookie", c);
            }
        } else {
            const single = res.headers.get("set-cookie");
            if (single) {
                response.headers.append("Set-Cookie", single);
            }
        }
        return response;
    } catch (e) {
        console.error("POST /api/auth/spring-sync", e);
        return NextResponse.json({ success: false, message: "Spring 세션 연동 실패" }, { status: 500 });
    }
}
