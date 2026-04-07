import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/point-policy`, {
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
        console.error("GET /api/point-policy", e);
        return NextResponse.json({ success: false, message: "조회 실패" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") ?? "";
        const body = await req.json();
        const res = await fetch(`${API_BASE_URL}/api/point-policy`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(cookie ? { cookie } : {}),
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        const response = NextResponse.json(data, { status: res.status });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) response.headers.set("set-cookie", setCookie);
        return response;
    } catch (e) {
        console.error("PUT /api/point-policy", e);
        return NextResponse.json({ success: false, message: "저장 실패" }, { status: 500 });
    }
}
