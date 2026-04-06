import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


export async function DELETE(req: NextRequest, context: { params: Promise<{ seq: string }> }) {
    try {
        const { seq } = await context.params;
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/content-filter-words/delete/${seq}`, {
            method: "DELETE",
            headers: {
                ...(cookie ? { cookie } : {}),
            },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("DELETE /api/content-filter-words/delete error =", error);
        return NextResponse.json({ success: false, message: "필터 단어 삭제 실패" }, { status: 500 });
    }
}
