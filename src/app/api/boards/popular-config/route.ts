import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { proxyAuthHeaders } from "@/lib/server/proxyAuthHeaders";

export async function GET(req: NextRequest) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/boards/popular-config`, {
            method: "GET",
            cache: "no-store",
            headers: proxyAuthHeaders(req),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/boards/popular-config error =", error);
        return NextResponse.json({ success: false, message: "자유게시판 인기글 설정 조회 실패" }, { status: 500 });
    }
}
