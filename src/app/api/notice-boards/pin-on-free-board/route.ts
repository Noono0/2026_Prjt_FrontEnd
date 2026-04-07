import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/notice-boards/pin-on-free-board`, {
            method: "GET",
            cache: "no-store",
            headers: cookie ? { cookie } : {},
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/notice-boards/pin-on-free-board error =", error);
        return NextResponse.json({ success: false, message: "고정 공지 조회 실패" }, { status: 500 });
    }
}
