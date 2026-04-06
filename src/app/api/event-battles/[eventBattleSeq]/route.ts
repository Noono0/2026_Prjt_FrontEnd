import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
export const runtime = "edge";


type Params = { params: Promise<{ eventBattleSeq: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { eventBattleSeq } = await params;
        const res = await fetch(`${API_BASE_URL}/api/event-battles/${eventBattleSeq}`, {
            method: "GET",
            headers: { cookie: req.headers.get("cookie") ?? "" },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/event-battles/[eventBattleSeq]", error);
        return NextResponse.json({ success: false, message: "상세 조회 실패" }, { status: 500 });
    }
}
