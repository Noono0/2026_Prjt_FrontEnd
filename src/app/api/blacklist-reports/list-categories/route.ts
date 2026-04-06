import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/blacklist-reports/list-categories`, {
            method: "GET",
            cache: "no-store",
            headers: cookie ? { cookie } : {},
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/blacklist-reports/list-categories", error);
        return NextResponse.json({ success: false, message: "목록 조회 카테고리 로드 실패" }, { status: 500 });
    }
}
