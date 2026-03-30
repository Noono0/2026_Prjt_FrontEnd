import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/members/me/wallet/exchange/gold-diamond`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
            body: JSON.stringify(body),
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        console.error("POST exchange gold-diamond", e);
        return NextResponse.json({ success: false, message: "교환 실패" }, { status: 500 });
    }
}
