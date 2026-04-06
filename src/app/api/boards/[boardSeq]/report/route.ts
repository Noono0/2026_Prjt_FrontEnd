import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


type Params = {
    params: Promise<{
        boardSeq: string;
    }>;
};

export async function POST(_req: NextRequest, { params }: Params) {
    try {
        const { boardSeq } = await params;
        const res = await fetch(`${API_BASE_URL}/api/boards/${boardSeq}/report`, {
            method: "POST",
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST /api/boards/[boardSeq]/report error =", error);
        return NextResponse.json(
            { success: false, message: "신고 처리 실패" },
            { status: 500 }
        );
    }
}
