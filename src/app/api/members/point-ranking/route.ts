import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { springProxyHeaders } from "@/lib/spring-proxy-request";

export async function GET(req: NextRequest) {
    try {
        const period = req.nextUrl.searchParams.get("period") ?? "DAY";
        const res = await fetch(`${API_BASE_URL}/api/members/point-ranking?period=${encodeURIComponent(period)}`, {
            method: "GET",
            headers: springProxyHeaders(req),
            cache: "no-store",
        });
        const data = await res.json();
        const response = NextResponse.json(data, { status: res.status });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) response.headers.set("set-cookie", setCookie);
        return response;
    } catch (e) {
        console.error("GET /api/members/point-ranking", e);
        return NextResponse.json({ success: false, message: "랭킹 조회 실패" }, { status: 500 });
    }
}
