import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { logBackendProxyAuthFailure, proxyAuthHeaders } from "@/lib/server/proxyAuthHeaders";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await fetch(`${API_BASE_URL}/api/inquiry-boards/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...proxyAuthHeaders(req),
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });
        logBackendProxyAuthFailure("PUT /api/inquiry-boards/update → Spring", req, res.status);
        return NextResponse.json(await res.json(), { status: res.status });
    } catch {
        return NextResponse.json({ success: false, message: "문의게시판 수정 실패" }, { status: 500 });
    }
}
