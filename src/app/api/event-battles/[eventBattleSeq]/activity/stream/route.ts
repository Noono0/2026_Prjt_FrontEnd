import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = { params: Promise<{ eventBattleSeq: string }> };

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { eventBattleSeq } = await params;
        const res = await fetch(`${API_BASE_URL}/api/event-battles/${eventBattleSeq}/activity/stream`, {
            method: "GET",
            headers: {
                cookie: req.headers.get("cookie") ?? "",
            },
            cache: "no-store",
        });

        if (!res.ok || !res.body) {
            const data = await res.json().catch(() => null);
            return NextResponse.json(
                data ?? { success: false, message: "활동 SSE 스트림 실패" },
                { status: res.status }
            );
        }

        const headers = new Headers();
        headers.set("Content-Type", "text/event-stream; charset=utf-8");
        headers.set("Cache-Control", "no-cache, no-transform");
        headers.set("Connection", "keep-alive");
        // reverse-proxy 버퍼링 방지(환경에 따라 적용)
        headers.set("X-Accel-Buffering", "no");

        return new NextResponse(res.body as any, { status: res.status, headers });
    } catch (error) {
        console.error("GET /api/event-battles/.../activity/stream", error);
        return NextResponse.json({ success: false, message: "SSE 스트림 실패" }, { status: 500 });
    }
}

