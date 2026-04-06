import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


type Params = {
    params: Promise<{
        noticeBoardSeq: string;
    }>;
};

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { noticeBoardSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/notice-boards/detail/${noticeBoardSeq}`, {
            method: "GET",
            headers: {
                ...(cookie ? { cookie } : {}),
            },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/notice-boards/detail/[noticeBoardSeq] error =", error);
        return NextResponse.json({ success: false, message: "공지사항 상세 조회 실패" }, { status: 500 });
    }
}
