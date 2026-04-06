import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


type Params = {
    params: Promise<{ noticeBoardSeq: string; commentSeq: string }>;
};

export async function POST(_req: NextRequest, { params }: Params) {
    try {
        const { noticeBoardSeq, commentSeq } = await params;
        const cookie = _req.headers.get("cookie") ?? "";
        const res = await fetch(
            `${API_BASE_URL}/api/notice-boards/${noticeBoardSeq}/comments/${commentSeq}/dislike`,
            {
                method: "POST",
                headers: cookie ? { cookie } : {},
                cache: "no-store",
            }
        );
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST notice comment dislike error =", error);
        return NextResponse.json({ success: false, message: "처리 실패" }, { status: 500 });
    }
}
