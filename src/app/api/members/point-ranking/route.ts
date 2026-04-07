import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") ?? "";
        const period = req.nextUrl.searchParams.get("period") ?? "DAY";
        const res = await fetch(`${API_BASE_URL}/api/members/point-ranking?period=${encodeURIComponent(period)}`, {
            method: "GET",
            headers: cookie ? { cookie } : {},
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
