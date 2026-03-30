import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = {
    params: Promise<{
        noticeBoardSeq: string;
    }>;
};

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { noticeBoardSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/notice-boards/${noticeBoardSeq}/report`, {
            method: "POST",
            headers: {
                ...(cookie ? { cookie } : {}),
            },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST /api/notice-boards/[noticeBoardSeq]/report error =", error);
        return NextResponse.json({ success: false, message: "신고 처리 실패" }, { status: 500 });
    }
}
