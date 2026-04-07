import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { forwardSpringSetCookies } from "@/lib/forwardSpringSetCookies";

export async function POST(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") ?? "";

        const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: "POST",
            headers: {
                ...(cookie ? { cookie } : {}),
            },
            cache: "no-store",
        });

        const data = await res.json();
        const response = NextResponse.json(data, { status: res.status });
        forwardSpringSetCookies(res, response);
        return response;
    } catch (error) {
        console.error("POST /api/auth/logout error =", error);
        return NextResponse.json(
            { success: false, message: "로그아웃 실패" },
            { status: 500 }
        );
    }
}
