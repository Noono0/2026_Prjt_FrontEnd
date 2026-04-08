import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { logBackendProxyAuthFailure, proxyAuthHeaders } from "@/lib/server/proxyAuthHeaders";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await fetch(`${API_BASE_URL}/api/inquiry-boards/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...proxyAuthHeaders(req),
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });
        logBackendProxyAuthFailure("POST /api/inquiry-boards/create → Spring", req, res.status);
        const response = NextResponse.json(await res.json(), { status: res.status });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) response.headers.set("set-cookie", setCookie);
        return response;
    } catch {
        return NextResponse.json({ success: false, message: "문의게시판 등록 실패" }, { status: 500 });
    }
}
