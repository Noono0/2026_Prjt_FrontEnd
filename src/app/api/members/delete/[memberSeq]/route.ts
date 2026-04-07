import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { springProxyHeaders } from "@/lib/spring-proxy-request";

type Params = {
    params: Promise<{ memberSeq: string }>;
};

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { memberSeq } = await params;

        const res = await fetch(`${API_BASE_URL}/api/members/delete/${memberSeq}`, {
            method: "DELETE",
            headers: springProxyHeaders(req),
            cache: "no-store",
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error("DELETE /api/members/delete/[memberSeq] error =", error);
        return NextResponse.json(
            { success: false, message: "회원 삭제 실패" },
            { status: 500 }
        );
    }
}
