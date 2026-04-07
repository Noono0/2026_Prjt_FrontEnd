import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const qs = searchParams.toString();
        const res = await fetch(`${API_BASE_URL}/api/analytics/overview${qs ? `?${qs}` : ""}`, {
            method: "GET",
            headers: {
                cookie: req.headers.get("cookie") ?? "",
            },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/analytics/overview", error);
        return NextResponse.json({ success: false, message: "방문자 통계 조회 실패" }, { status: 500 });
    }
}
