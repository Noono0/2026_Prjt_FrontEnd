import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

/**
 * 공통 파일 업로드 → Spring `/api/files/upload` (attach_file 메타 + 디스크 저장)
 * FormData: file, menuUrl(선택)
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const cookie = req.headers.get("cookie") ?? "";

        const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
            method: "POST",
            body: formData,
            headers: cookie ? { cookie } : {},
            cache: "no-store",
        });

        const data = await res.json();
        const response = NextResponse.json(data, { status: res.status });
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            response.headers.set("set-cookie", setCookie);
        }
        return response;
    } catch (error) {
        console.error("POST /api/files/upload error =", error);
        return NextResponse.json(
            { success: false, message: "파일 업로드 프록시 실패" },
            { status: 500 }
        );
    }
}
