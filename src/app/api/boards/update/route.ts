import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { proxyAuthHeaders } from "@/lib/server/proxyAuthHeaders";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await fetch(`${API_BASE_URL}/api/boards/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...proxyAuthHeaders(req),
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("PUT /api/boards/update error =", error);
        return NextResponse.json({ success: false, message: "자유게시판 수정 실패" }, { status: 500 });
    }
}
