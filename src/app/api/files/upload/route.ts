import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { proxyAuthHeaders } from "@/lib/server/proxyAuthHeaders";
import { serverLog } from "@/lib/serverLog";

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

        const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
            method: "POST",
            body: outgoing,
            headers: proxyAuthHeaders(req),
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

        const envelope = data as {
            success?: boolean;
            message?: string;
            data?: { fileSeq?: number; fileUrl?: string; fileSize?: number };
        };
        if (res.ok && envelope.success !== false && envelope.data?.fileUrl) {
            const fileUrl = envelope.data.fileUrl;
            const fileSeq = envelope.data.fileSeq;
            const siteOrigin = req.nextUrl.origin;
            let fileUrlHostMismatch = false;
            try {
                fileUrlHostMismatch = new URL(fileUrl).origin !== siteOrigin;
            } catch {
                /* ignore */
            }
            serverLog("info", "[files-upload] 프록시_성공", {
                fileSeq,
                fileUrl,
                fileSize: envelope.data.fileSize,
                siteOrigin,
                springApiBase: API_BASE_URL,
                fileUrlHostMismatch,
                hint: fileUrlHostMismatch
                    ? "Spring이_준_fileUrl_호스트가_사이트와_다름→img_X박스_가능→백엔드_APP_FILE_PUBLIC_BASE_URL_을_사이트공개URL로"
                    : "댓글HTML의_img_src는_가능하면_/api/files/view/{seq}_상대경로_권장",
            });
            if (fileUrlHostMismatch) {
                serverLog("warn", "[files-upload] fileUrl_호스트_불일치_이미지깨짐_원인_일반적", {
                    fileUrl,
                    siteOrigin,
                });
            }
        } else if (!res.ok || envelope.success === false) {
            serverLog("warn", "[files-upload] 프록시_실패", {
                httpStatus: res.status,
                backendMessage: envelope.message ?? text?.trim().slice(0, 240),
                springApiBase: API_BASE_URL,
            });
        }

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
        serverLog("error", "[files-upload] 프록시_예외", {
            err: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ success: false, message: "파일 업로드 프록시 실패" }, { status: 500 });
    }
}
