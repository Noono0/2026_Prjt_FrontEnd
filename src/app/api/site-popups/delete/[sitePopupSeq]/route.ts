import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ sitePopupSeq: string }> }
) {
    try {
        const { sitePopupSeq } = await context.params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/site-popups/delete/${sitePopupSeq}`, {
            method: "DELETE",
            headers: cookie ? { cookie } : {},
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("DELETE /api/site-popups/delete error =", error);
        return NextResponse.json({ success: false, message: "팝업 삭제 실패" }, { status: 500 });
    }
}
