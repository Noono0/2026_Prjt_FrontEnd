import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ sitePopupSeq: string }> }
) {
    try {
        const { sitePopupSeq } = await context.params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/site-popups/detail/${sitePopupSeq}`, {
            method: "GET",
            headers: cookie ? { cookie } : {},
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/site-popups/detail error =", error);
        return NextResponse.json({ success: false, message: "팝업 상세 조회 실패" }, { status: 500 });
    }
}
