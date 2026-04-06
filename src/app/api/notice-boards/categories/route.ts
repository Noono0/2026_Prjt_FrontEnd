import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


export async function GET() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/notice-boards/categories`, {
            method: "GET",
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/notice-boards/categories error =", error);
        return NextResponse.json({ success: false, message: "공지사항 카테고리 조회 실패" }, { status: 500 });
    }
}
