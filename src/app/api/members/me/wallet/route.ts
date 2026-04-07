import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { forwardSpringSetCookies } from "@/lib/forwardSpringSetCookies";
import { springProxyHeaders } from "@/lib/spring-proxy-request";

export async function GET(req: NextRequest) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/members/me/wallet`, {
            method: "GET",
            headers: springProxyHeaders(req),
            cache: "no-store",
        });
        const data = await res.json();
        const response = NextResponse.json(data, { status: res.status });
        forwardSpringSetCookies(res, response);
        return response;
    } catch (e) {
        console.error("GET /api/members/me/wallet", e);
        return NextResponse.json({ success: false, message: "지갑 조회 실패" }, { status: 500 });
    }
}
