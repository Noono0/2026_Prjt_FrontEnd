import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


type Params = { params: Promise<{ eventBattleSeq: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { eventBattleSeq } = await params;
        const res = await fetch(`${API_BASE_URL}/api/event-battles/${eventBattleSeq}/cancel`, {
            method: "POST",
            headers: {
                cookie: req.headers.get("cookie") ?? "",
            },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST /api/event-battles/.../cancel", error);
        return NextResponse.json({ success: false, message: "취소 실패" }, { status: 500 });
    }
}

