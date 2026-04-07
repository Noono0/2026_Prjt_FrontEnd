import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = {
    params: Promise<{ boardSeq: string; commentSeq: string }>;
};

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { boardSeq, commentSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/boards/${boardSeq}/comments/${commentSeq}/dislike`, {
            method: "POST",
            cache: "no-store",
            headers: cookie ? { cookie } : {},
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("…/comments/dislike error =", error);
        return NextResponse.json({ success: false, message: "처리 실패" }, { status: 500 });
    }
}
