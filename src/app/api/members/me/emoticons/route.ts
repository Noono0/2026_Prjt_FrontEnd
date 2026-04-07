import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/members/me/emoticons`, {
            method: "GET",
            cache: "no-store",
            headers: cookie ? { cookie } : {},
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        console.error("GET /api/members/me/emoticons", e);
        return NextResponse.json({ success: false, message: "이모티콘 목록 조회 실패" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const cookie = req.headers.get("cookie") ?? "";
        const res = await fetch(`${API_BASE_URL}/api/members/me/emoticons`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
            body: JSON.stringify(body),
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        console.error("POST /api/members/me/emoticons", e);
        return NextResponse.json({ success: false, message: "이모티콘 등록 실패" }, { status: 500 });
    }
}
