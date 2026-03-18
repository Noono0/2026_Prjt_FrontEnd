import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = {
    params: Promise<{
        memberSeq: string;
    }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const { memberSeq } = await params;

        const res = await fetch(`${API_BASE_URL}/api/members/detail/${memberSeq}`, {
            method: "GET",
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("GET /api/members/detail/[memberSeq] error =", error);
        return NextResponse.json(
            { success: false, message: "회원 상세 조회 실패" },
            { status: 500 }
        );
    }
}