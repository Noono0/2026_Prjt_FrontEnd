import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


type Params = { params: Promise<{ boardSeq: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { boardSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/inquiry-boards/mine/${boardSeq}`, {
            method: "DELETE",
            headers: {
                ...(cookie ? { cookie } : {}),
            },
            cache: "no-store",
        });
        const response = NextResponse.json(await res.json(), { status: res.status });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) response.headers.set("set-cookie", setCookie);
        return response;
    } catch {
        return NextResponse.json({ success: false, message: "문의게시판 삭제 실패" }, { status: 500 });
    }
}

