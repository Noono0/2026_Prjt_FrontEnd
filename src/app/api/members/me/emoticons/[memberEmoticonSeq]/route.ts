import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { springProxyHeaders } from "@/lib/spring-proxy-request";

type Params = { params: Promise<{ memberEmoticonSeq: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { memberEmoticonSeq } = await params;
        const res = await fetch(`${API_BASE_URL}/api/members/me/emoticons/${memberEmoticonSeq}`, {
            method: "DELETE",
            cache: "no-store",
            headers: springProxyHeaders(req),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e) {
        console.error("DELETE /api/members/me/emoticons/[seq]", e);
        return NextResponse.json({ success: false, message: "삭제 실패" }, { status: 500 });
    }
}
