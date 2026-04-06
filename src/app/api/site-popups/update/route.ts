import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/site-popups/update`, {
            method: "PUT",
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
        console.error("PUT /api/site-popups/update error =", error);
        return NextResponse.json({ success: false, message: "팝업 수정 실패" }, { status: 500 });
    }
}
