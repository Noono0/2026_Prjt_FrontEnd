import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { logBackendProxyAuthFailure, proxyAuthHeaders } from "@/lib/server/proxyAuthHeaders";

export async function GET(req: NextRequest) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/inquiry-boards/categories`, {
            method: "GET",
            cache: "no-store",
            headers: proxyAuthHeaders(req),
        });
        logBackendProxyAuthFailure("GET /api/inquiry-boards/categories → Spring", req, res.status);
        return NextResponse.json(await res.json(), { status: res.status });
    } catch {
        return NextResponse.json({ success: false, message: "문의게시판 카테고리 조회 실패" }, { status: 500 });
    }
}
