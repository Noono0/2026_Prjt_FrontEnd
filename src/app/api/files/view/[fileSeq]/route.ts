import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { proxyAuthHeaders } from "@/lib/server/proxyAuthHeaders";
import { serverLog } from "@/lib/serverLog";

type Params = {
    params: Promise<{
        fileSeq: string;
    }>;
};

/** 브라우저에서 `/api/files/view/{seq}` 상대 경로로 이미지 표시 → Spring 프록시 */
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { fileSeq } = await params;

        const res = await fetch(`${API_BASE_URL}/api/files/view/${fileSeq}`, {
            method: "GET",
            headers: proxyAuthHeaders(req),
            cache: "no-store",
        });

        if (!res.ok) {
            const hint =
                res.status === 404
                    ? "Spring로그_[attach-file]_조회실패_메타없음_또는_저장소바이너리없음"
                    : res.status >= 500
                      ? "Spring_저장소_IO_등_서버오류"
                      : "백엔드_응답_확인";
            serverLog("warn", "[files-view] Spring_이미지_조회_실패", {
                fileSeq,
                backendStatus: res.status,
                springUrl: `${API_BASE_URL}/api/files/view/${fileSeq}`,
                hint,
            });
            return new NextResponse(null, { status: res.status });
        }

        const headers = new Headers();
        const ct = res.headers.get("content-type");
        if (ct) headers.set("content-type", ct);
        const cd = res.headers.get("content-disposition");
        if (cd) headers.set("content-disposition", cd);

        return new NextResponse(res.body, { status: 200, headers });
    } catch (error) {
        serverLog("error", "[files-view] 프록시_예외", {
            err: error instanceof Error ? error.message : String(error),
        });
        return new NextResponse(null, { status: 500 });
    }
}
