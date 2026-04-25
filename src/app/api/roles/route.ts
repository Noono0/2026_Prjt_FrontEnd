import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { springProxyHeaders } from "@/lib/spring-proxy-request";

export async function GET(req: NextRequest) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/roles`, {
            method: "GET",
            headers: springProxyHeaders(req),
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch {
        return NextResponse.json({ success: false, message: "권한 목록 조회 실패" }, { status: 500 });
    }
}
