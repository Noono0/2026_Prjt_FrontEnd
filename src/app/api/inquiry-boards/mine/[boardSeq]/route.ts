import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { logBackendProxyAuthFailure, proxyAuthHeaders } from "@/lib/server/proxyAuthHeaders";

type Params = { params: Promise<{ boardSeq: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { boardSeq } = await params;
        const res = await fetch(`${API_BASE_URL}/api/inquiry-boards/mine/${boardSeq}`, {
            method: "DELETE",
            headers: proxyAuthHeaders(req),
            cache: "no-store",
        });
        logBackendProxyAuthFailure("DELETE /api/inquiry-boards/mine → Spring", req, res.status);
        const response = NextResponse.json(await res.json(), { status: res.status });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) response.headers.set("set-cookie", setCookie);
        return response;
    } catch {
        return NextResponse.json({ success: false, message: "문의게시판 삭제 실패" }, { status: 500 });
    }
}
