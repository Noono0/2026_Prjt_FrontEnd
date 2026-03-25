import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const res = await fetch(`${API_BASE_URL}/api/boards/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST /api/boards/search error =", error);
        return NextResponse.json(
            { success: false, message: "자유게시판 목록 조회 실패" },
            { status: 500 }
        );
    }
}

