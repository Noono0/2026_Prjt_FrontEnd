import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = { params: Promise<{ blacklistReportSeq: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { blacklistReportSeq } = await params;
        const sort = req.nextUrl.searchParams.get("sort") || "latest";
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(
            `${API_BASE_URL}/api/blacklist-reports/${blacklistReportSeq}/comments?sort=${encodeURIComponent(sort)}`,
            {
                method: "GET",
                cache: "no-store",
                headers: cookie ? { cookie } : {},
            }
        );
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/blacklist-reports/.../comments", error);
        return NextResponse.json({ success: false, message: "댓글 목록 조회 실패" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { blacklistReportSeq } = await params;
        const body = await req.json();
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/blacklist-reports/${blacklistReportSeq}/comments`, {
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
        console.error("POST /api/blacklist-reports/.../comments", error);
        return NextResponse.json({ success: false, message: "댓글 등록 실패" }, { status: 500 });
    }
}
