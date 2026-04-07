import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = { params: Promise<{ eventBattleSeq: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { eventBattleSeq } = await params;
        const url = new URL(req.url);
        const qs = url.searchParams.toString();
        const path = `${API_BASE_URL}/api/event-battles/${eventBattleSeq}/activity${qs ? `?${qs}` : ""}`;
        const res = await fetch(path, {
            method: "GET",
            headers: { cookie: req.headers.get("cookie") ?? "" },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/event-battles/.../activity", error);
        return NextResponse.json({ success: false, message: "활동 조회 실패" }, { status: 500 });
    }
}
