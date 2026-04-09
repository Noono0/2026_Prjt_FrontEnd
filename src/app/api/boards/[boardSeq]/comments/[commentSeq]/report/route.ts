import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { proxyAuthHeaders } from "@/lib/server/proxyAuthHeaders";

type Params = {
    params: Promise<{ boardSeq: string; commentSeq: string }>;
};

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { boardSeq, commentSeq } = await params;
        const res = await fetch(`${API_BASE_URL}/api/boards/${boardSeq}/comments/${commentSeq}/report`, {
            method: "POST",
            cache: "no-store",
            headers: proxyAuthHeaders(req),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("…/comments/report error =", error);
        return NextResponse.json({ success: false, message: "처리 실패" }, { status: 500 });
    }
}
