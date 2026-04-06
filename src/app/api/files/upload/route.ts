import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

/**
 * 공통 파일 업로드 → Spring `/api/files/upload` (attach_file 메타 + 디스크 저장)
 * FormData: file, menuUrl(선택)
 */
export async function POST(req: NextRequest) {
    try {
        const incoming = await req.formData();
        /** Next → Node fetch 멀티파트 전달 시 경계/스트림 이슈 방지: 바이트로 재조립 */
        const outgoing = new FormData();
        for (const [key, value] of incoming.entries()) {
            if (typeof value === "string") {
                outgoing.append(key, value);
            } else {
                const file = value as File;
                const ab = await file.arrayBuffer();
                const blob = new Blob([ab], {
                    type: file.type || "application/octet-stream",
                });
                outgoing.append(key, blob, file.name || "upload");
            }
        }

        const cookie = req.headers.get("cookie") ?? "";

        const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
            method: "POST",
            body: outgoing,
            headers: cookie ? { cookie } : {},
            cache: "no-store",
        });

        const text = await res.text();
        let data: unknown;
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = {
                success: false,
                message: text?.trim().slice(0, 300) || "백엔드 응답이 JSON이 아닙니다.",
            };
        }
        const response = NextResponse.json(data, { status: res.status });
        const multi = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
        if (multi.length > 0) {
            for (const c of multi) {
                response.headers.append("Set-Cookie", c);
            }
        } else {
            const single = res.headers.get("set-cookie");
            if (single) {
                response.headers.append("Set-Cookie", single);
            }
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
