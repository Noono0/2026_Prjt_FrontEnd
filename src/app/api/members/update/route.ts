import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { springProxyHeaders } from "@/lib/spring-proxy-request";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();

        const res = await fetch(`${API_BASE_URL}/api/members/update`, {
            method: "PUT",
            headers: springProxyHeaders(req, { "Content-Type": "application/json" }),
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("PUT /api/members/update error =", error);
        return NextResponse.json(
            { success: false, message: "회원 수정 실패" },
            { status: 500 }
        );
    }
}
