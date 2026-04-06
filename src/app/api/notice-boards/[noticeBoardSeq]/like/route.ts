import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


type Params = {
    params: Promise<{
        noticeBoardSeq: string;
    }>;
};

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { noticeBoardSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/notice-boards/${noticeBoardSeq}/like`, {
            method: "POST",
            headers: {
                ...(cookie ? { cookie } : {}),
            },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST /api/notice-boards/[noticeBoardSeq]/like error =", error);
        return NextResponse.json({ success: false, message: "좋아요 처리 실패" }, { status: 500 });
    }
}
