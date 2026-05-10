import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ supportSeq: string }> }) {
    try {
        const { supportSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/site-support/delete/${supportSeq}`, {
            method: "DELETE",
            headers: {
                ...(cookie ? { cookie } : {}),
            },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("DELETE /api/site-support/delete error =", error);
        return NextResponse.json({ success: false, message: "삭제 실패" }, { status: 500 });
    }
}
