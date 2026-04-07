import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { springProxyHeaders } from "@/lib/spring-proxy-request";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await fetch(`${API_BASE_URL}/api/members/me/wallet/gift-points`, {
            method: "POST",
            headers: springProxyHeaders(req, { "Content-Type": "application/json" }),
            body: JSON.stringify(body),
            cache: "no-store",
        });
        const data = await res.json();
        const response = NextResponse.json(data, { status: res.status });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) response.headers.set("set-cookie", setCookie);
        return response;
    } catch (e) {
        console.error("POST gift-points", e);
        return NextResponse.json({ success: false, message: "선물 처리 실패" }, { status: 500 });
    }
}
