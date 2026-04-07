import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = { params: Promise<{ eventBattleSeq: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { eventBattleSeq } = await params;
        const body = await req.json();
        const res = await fetch(`${API_BASE_URL}/api/event-battles/${eventBattleSeq}/votes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                cookie: req.headers.get("cookie") ?? "",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST /api/event-battles/.../votes", error);
        return NextResponse.json({ success: false, message: "투표 실패" }, { status: 500 });
    }
}
