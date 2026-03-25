import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const res = await fetch(`${API_BASE_URL}/api/files/upload/board-image`, {
            method: "POST",
            body: formData,
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST /api/files/upload/board-image error =", error);
        return NextResponse.json(
            { success: false, message: "게시판 이미지 업로드 실패" },
            { status: 500 }
        );
    }
}

