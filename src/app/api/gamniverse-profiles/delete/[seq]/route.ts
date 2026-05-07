import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function DELETE(req: NextRequest, context: { params: Promise<{ seq: string }> }) {
    try {
        const { seq } = await context.params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/gamniverse-profiles/delete/${seq}`, {
            method: "DELETE",
            headers: {
                ...(cookie ? { cookie } : {}),
            },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("DELETE /api/gamniverse-profiles/delete/[seq] error =", error);
        return NextResponse.json({ success: false, message: "멤버스트리머 프로필 삭제 실패" }, { status: 500 });
    }
}
