import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const search = url.search;
        const res = await fetch(`${API_BASE_URL}/api/blacklist-reports/export${search}`, {
            method: "GET",
            headers: { cookie: req.headers.get("cookie") ?? "" },
            cache: "no-store",
        });

        const contentType =
            res.headers.get("Content-Type") ??
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        const disposition = res.headers.get("Content-Disposition");

        const buf = await res.arrayBuffer();
        const headers = new Headers();
        headers.set("Content-Type", contentType);
        if (disposition) {
            headers.set("Content-Disposition", disposition);
        }

        return new NextResponse(buf, { status: res.status, headers });
    } catch (error) {
        console.error("GET /api/blacklist-reports/export", error);
        return NextResponse.json({ success: false, message: "엑셀 다운로드 실패" }, { status: 500 });
    }
}
