import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/members/me/wallet`, {
            method: "GET",
            headers: cookie ? { cookie } : {},
            cache: "no-store",
        });
        const data = await res.json();
        const response = NextResponse.json(data, { status: res.status });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) response.headers.set("set-cookie", setCookie);
        return response;
    } catch (e) {
        console.error("GET /api/members/me/wallet", e);
        return NextResponse.json({ success: false, message: "지갑 조회 실패" }, { status: 500 });
    }
}
