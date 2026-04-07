import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = {
    params: Promise<{ boardSeq: string }>;
};

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { boardSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/boards/mine/${boardSeq}`, {
            method: "DELETE",
            headers: cookie ? { cookie } : {},
            cache: "no-store",
        });
        const data = await res.json();
        const response = NextResponse.json(data, { status: res.status });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) response.headers.set("set-cookie", setCookie);
        return response;
    } catch (e) {
        console.error("DELETE /api/boards/mine/[boardSeq]", e);
        return NextResponse.json({ success: false, message: "삭제 실패" }, { status: 500 });
    }
}
