import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


export async function GET() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/boards/popular-config`, {
            method: "GET",
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/boards/popular-config error =", error);
        return NextResponse.json(
            { success: false, message: "자유게시판 인기글 설정 조회 실패" },
            { status: 500 }
        );
    }
}
