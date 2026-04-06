import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


type Params = { params: Promise<{ eventBattleSeq: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { eventBattleSeq } = await params;
        const res = await fetch(`${API_BASE_URL}/api/event-battles/${eventBattleSeq}/close-voting`, {
            method: "POST",
            headers: {
                cookie: req.headers.get("cookie") ?? "",
                "Content-Type": "application/json",
            },
            cache: "no-store",
            body: JSON.stringify({}),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST /api/event-battles/.../close-voting", error);
        return NextResponse.json({ success: false, message: "투표 마감 실패" }, { status: 500 });
    }
}
