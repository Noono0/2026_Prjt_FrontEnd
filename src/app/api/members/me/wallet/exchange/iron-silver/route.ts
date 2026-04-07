import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { forwardSpringSetCookies } from "@/lib/forwardSpringSetCookies";
import { springProxyHeaders } from "@/lib/spring-proxy-request";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await fetch(`${API_BASE_URL}/api/members/me/wallet/exchange/iron-silver`, {
            method: "POST",
            headers: springProxyHeaders(req, { "Content-Type": "application/json" }),
            body: JSON.stringify(body),
            cache: "no-store",
        });
        const data = await res.json();
        const response = NextResponse.json(data, { status: res.status });
        forwardSpringSetCookies(res, response);
        return response;
    } catch (e) {
        console.error("POST exchange iron-silver", e);
        return NextResponse.json({ success: false, message: "교환 실패" }, { status: 500 });
    }
}
