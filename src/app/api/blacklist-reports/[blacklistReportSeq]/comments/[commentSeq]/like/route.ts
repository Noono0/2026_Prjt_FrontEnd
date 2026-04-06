import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


type Params = { params: Promise<{ blacklistReportSeq: string; commentSeq: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { blacklistReportSeq, commentSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(
            `${API_BASE_URL}/api/blacklist-reports/${blacklistReportSeq}/comments/${commentSeq}/like`,
            {
                method: "POST",
                cache: "no-store",
                headers: cookie ? { cookie } : {},
            }
        );
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST blacklist comment like", error);
        return NextResponse.json({ success: false, message: "댓글 추천 실패" }, { status: 500 });
    }
}
