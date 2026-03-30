import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = { params: Promise<{ blacklistReportSeq: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { blacklistReportSeq } = await params;
        const res = await fetch(`${API_BASE_URL}/api/blacklist-reports/mine/${blacklistReportSeq}`, {
            method: "DELETE",
            headers: { cookie: req.headers.get("cookie") ?? "" },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("DELETE /api/blacklist-reports/mine", error);
        return NextResponse.json({ success: false, message: "삭제 실패" }, { status: 500 });
    }
}
