import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


type Params = {
    params: Promise<{ noticeBoardSeq: string }>;
};

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { noticeBoardSeq } = await params;
        const sort = req.nextUrl.searchParams.get("sort") || "latest";
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(
            `${API_BASE_URL}/api/notice-boards/${noticeBoardSeq}/comments?sort=${encodeURIComponent(sort)}`,
            {
                method: "GET",
                cache: "no-store",
                headers: cookie ? { cookie } : {},
            }
        );
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/notice-boards/[noticeBoardSeq]/comments error =", error);
        return NextResponse.json({ success: false, message: "댓글 목록 조회 실패" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { noticeBoardSeq } = await params;
        const body = await req.json();
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/notice-boards/${noticeBoardSeq}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(cookie ? { cookie } : {}),
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST /api/notice-boards/[noticeBoardSeq]/comments error =", error);
        return NextResponse.json({ success: false, message: "댓글 등록 실패" }, { status: 500 });
    }
}
