import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const res = await fetch(`${API_BASE_URL}/api/members/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("POST /api/members/create error =", error);
        return NextResponse.json(
            { success: false, message: "회원 등록 실패" },
            { status: 500 }
        );
    }
}
