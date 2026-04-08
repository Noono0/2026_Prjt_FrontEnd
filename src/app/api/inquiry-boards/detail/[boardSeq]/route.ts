import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { logBackendProxyAuthFailure, proxyAuthHeaders } from "@/lib/server/proxyAuthHeaders";

type Params = { params: Promise<{ boardSeq: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { boardSeq } = await params;
        const password = req.nextUrl.searchParams.get("password");
        const q = password ? `?password=${encodeURIComponent(password)}` : "";
        const res = await fetch(`${API_BASE_URL}/api/inquiry-boards/detail/${boardSeq}${q}`, {
            method: "GET",
            cache: "no-store",
            headers: proxyAuthHeaders(req),
        });
        logBackendProxyAuthFailure("GET /api/inquiry-boards/detail → Spring", req, res.status);
        return NextResponse.json(await res.json(), { status: res.status });
    } catch {
        return NextResponse.json({ success: false, message: "문의게시판 상세 조회 실패" }, { status: 500 });
    }
}
