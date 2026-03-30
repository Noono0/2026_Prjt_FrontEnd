import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

type Params = {
    params: Promise<{
        fileSeq: string;
    }>;
};

/** 브라우저에서 `/api/files/view/{seq}` 상대 경로로 이미지 표시 → Spring 프록시 */
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { fileSeq } = await params;
        const cookie = req.headers.get("cookie") ?? "";

        const res = await fetch(`${API_BASE_URL}/api/files/view/${fileSeq}`, {
            method: "GET",
            headers: cookie ? { cookie } : {},
            cache: "no-store",
        });

        if (!res.ok) {
            return new NextResponse(null, { status: res.status });
        }

        const headers = new Headers();
        const ct = res.headers.get("content-type");
        if (ct) headers.set("content-type", ct);
        const cd = res.headers.get("content-disposition");
        if (cd) headers.set("content-disposition", cd);

        return new NextResponse(res.body, { status: 200, headers });
    } catch (error) {
        console.error("GET /api/files/view/[fileSeq] error =", error);
        return new NextResponse(null, { status: 500 });
    }
}
