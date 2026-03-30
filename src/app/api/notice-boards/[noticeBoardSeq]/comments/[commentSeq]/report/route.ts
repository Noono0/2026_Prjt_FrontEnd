import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = {
    params: Promise<{ noticeBoardSeq: string; commentSeq: string }>;
};

export async function POST(_req: NextRequest, { params }: Params) {
    try {
        const { noticeBoardSeq, commentSeq } = await params;
        const cookie = _req.headers.get("cookie") ?? "";
        const res = await fetch(
            `${API_BASE_URL}/api/notice-boards/${noticeBoardSeq}/comments/${commentSeq}/report`,
            {
                method: "POST",
                headers: cookie ? { cookie } : {},
                cache: "no-store",
            }
        );
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST notice comment report error =", error);
        return NextResponse.json({ success: false, message: "처리 실패" }, { status: 500 });
    }
}
