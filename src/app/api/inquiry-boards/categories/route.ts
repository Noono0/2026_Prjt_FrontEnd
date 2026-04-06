import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


export async function GET() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/inquiry-boards/categories`, {
            method: "GET",
            cache: "no-store",
        });
        return NextResponse.json(await res.json(), { status: res.status });
    } catch {
        return NextResponse.json({ success: false, message: "문의게시판 카테고리 조회 실패" }, { status: 500 });
    }
}

