import { defaultApiRequestInit } from "@/lib/http/requestInit";
import type { BoardComment } from "@/features/boards/types";
import type { BlacklistReportListItem, BlacklistReportSearchCondition } from "./types";

export type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data: T;
};

export type PageResponse<T> = {
    items: T[];
    page: number;
    size: number;
    totalCount: number;
};

export class ApiError extends Error {
    status?: number;
    constructor(message: string, options?: { status?: number }) {
        super(message);
        this.name = "ApiError";
        this.status = options?.status;
    }
}

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(input, { ...defaultApiRequestInit, ...init });
    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok || !json.success) {
        throw new ApiError(json?.message ?? "요청 실패", { status: res.status });
    }
    return json;
}

export async function searchBlacklistReports(
    condition: BlacklistReportSearchCondition
): Promise<PageResponse<BlacklistReportListItem>> {
    const result = await apiFetch<PageResponse<BlacklistReportListItem>>("/api/blacklist-reports/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });
    return result.data;
}

export async function fetchBlacklistReportDetail(seq: number): Promise<BlacklistReportListItem> {
    const result = await apiFetch<BlacklistReportListItem>(`/api/blacklist-reports/detail/${seq}`, { method: "GET" });
    return result.data;
}

export async function createBlacklistReport(payload: {
    blacklistTargetId: string;
    title: string;
    content: string;
    categoryCode?: string;
    commentAllowedYn?: string;
    replyAllowedYn?: string;
}): Promise<number> {
    const result = await apiFetch<number>("/api/blacklist-reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return Number(result.data ?? 0);
}

export async function updateBlacklistReport(payload: {
    blacklistReportSeq: number;
    blacklistTargetId: string;
    title: string;
    content: string;
    categoryCode?: string;
    commentAllowedYn?: string;
    replyAllowedYn?: string;
}): Promise<number> {
    const result = await apiFetch<number>("/api/blacklist-reports/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return Number(result.data ?? 0);
}

export async function deleteMyBlacklistReport(seq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/blacklist-reports/mine/${seq}`, { method: "DELETE" });
    return Number(result.data ?? 0);
}

export async function increaseBlacklistReportViewCount(seq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/blacklist-reports/${seq}/view`, { method: "POST" });
    return Number(result.data ?? 0);
}

export type BlacklistCategoryOption = { label: string; value: string };

/** 등록·수정 폼 (code_group A0005) */
export async function fetchBlacklistCategories(): Promise<BlacklistCategoryOption[]> {
    const result = await apiFetch<BlacklistCategoryOption[]>("/api/blacklist-reports/categories", { method: "GET" });
    return result.data ?? [];
}

/** 목록 조회 필터 칩 (code_group A0006) */
export async function fetchBlacklistListCategories(): Promise<BlacklistCategoryOption[]> {
    const result = await apiFetch<BlacklistCategoryOption[]>("/api/blacklist-reports/list-categories", {
        method: "GET",
    });
    return result.data ?? [];
}

export async function likeBlacklistReport(seq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/blacklist-reports/${seq}/like`, { method: "POST" });
    return Number(result.data ?? 0);
}

export async function dislikeBlacklistReport(seq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/blacklist-reports/${seq}/dislike`, { method: "POST" });
    return Number(result.data ?? 0);
}

export async function reportBlacklistReport(seq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/blacklist-reports/${seq}/report`, { method: "POST" });
    return Number(result.data ?? 0);
}

export type BlacklistCommentSavePayload = {
    content: string;
    parentBoardCommentSeq?: number;
    emoticonSeq1?: number;
    emoticonSeq2?: number;
    emoticonSeq3?: number;
};

export async function fetchBlacklistReportComments(
    blacklistReportSeq: number,
    sort: "latest" | "oldest" | "like" = "latest"
): Promise<BoardComment[]> {
    const q = encodeURIComponent(sort);
    const result = await apiFetch<BoardComment[]>(`/api/blacklist-reports/${blacklistReportSeq}/comments?sort=${q}`, {
        method: "GET",
    });
    return result.data ?? [];
}

export async function createBlacklistReportComment(
    blacklistReportSeq: number,
    payload: BlacklistCommentSavePayload
): Promise<number> {
    const result = await apiFetch<number>(`/api/blacklist-reports/${blacklistReportSeq}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return Number(result.data ?? 0);
}

export async function likeBlacklistReportComment(blacklistReportSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(
        `/api/blacklist-reports/${blacklistReportSeq}/comments/${commentSeq}/like`,
        { method: "POST" }
    );
    return Number(result.data ?? 0);
}

export async function dislikeBlacklistReportComment(blacklistReportSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(
        `/api/blacklist-reports/${blacklistReportSeq}/comments/${commentSeq}/dislike`,
        { method: "POST" }
    );
    return Number(result.data ?? 0);
}

export async function reportBlacklistReportComment(blacklistReportSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(
        `/api/blacklist-reports/${blacklistReportSeq}/comments/${commentSeq}/report`,
        { method: "POST" }
    );
    return Number(result.data ?? 0);
}

export async function updateBlacklistReportComment(
    blacklistReportSeq: number,
    commentSeq: number,
    payload: BlacklistCommentSavePayload
): Promise<number> {
    const result = await apiFetch<number>(`/api/blacklist-reports/${blacklistReportSeq}/comments/${commentSeq}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return Number(result.data ?? 0);
}

export async function deleteBlacklistReportComment(blacklistReportSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/blacklist-reports/${blacklistReportSeq}/comments/${commentSeq}`, {
        method: "DELETE",
    });
    return Number(result.data ?? 0);
}

/** Content-Disposition 에서 저장 파일명 추출 (RFC 5987 filename* + 일반 filename) */
function parseFilenameFromContentDisposition(header: string | null): string {
    const fallback = "blacklist-report.xlsx";
    if (!header?.trim()) return fallback;
    const h = header.trim();

    const star = /filename\*=(?:UTF-8'')([^;\n]+)/i.exec(h);
    if (star?.[1]) {
        try {
            return decodeURIComponent(star[1].trim().replace(/^["']|["']$/g, ""));
        } catch {
            /* fall through */
        }
    }

    const quoted = /filename="([^"]+)"/i.exec(h);
    if (quoted?.[1]) {
        return quoted[1];
    }

    const bare = /filename=([^;\s]+)/i.exec(h);
    if (bare?.[1]) {
        return bare[1].replace(/^["']|["']$/g, "");
    }

    return fallback;
}

/** 현재 목록 필터 기준으로 엑셀(.xlsx) 다운로드 (세션 쿠키 포함) */
export async function downloadBlacklistReportExcel(params: {
    blacklistTargetId?: string;
    keyword?: string;
    createDtFrom?: string;
    createDtTo?: string;
    /** 목록 상단 카테고리 칩과 동일 필터 */
    categoryCode?: string | null;
    /** 백엔드 허용 camelCase 필드명, 쉼표로 연결해 전달 */
    columns?: string[];
}) {
    const sp = new URLSearchParams();
    if (params.blacklistTargetId?.trim()) sp.set("blacklistTargetId", params.blacklistTargetId.trim());
    if (params.keyword?.trim()) sp.set("keyword", params.keyword.trim());
    if (params.createDtFrom?.trim()) sp.set("createDtFrom", params.createDtFrom.trim());
    if (params.createDtTo?.trim()) sp.set("createDtTo", params.createDtTo.trim());
    if (params.categoryCode?.trim()) sp.set("categoryCode", params.categoryCode.trim());
    if (params.columns?.length) sp.set("columns", params.columns.join(","));
    const q = sp.toString();
    const res = await fetch(`/api/blacklist-reports/export${q ? `?${q}` : ""}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
    });
    if (!res.ok) {
        throw new ApiError("엑셀 다운로드에 실패했습니다.", { status: res.status });
    }
    const blob = await res.blob();
    let filename = parseFilenameFromContentDisposition(res.headers.get("Content-Disposition"));
    if (filename.includes("=?") || filename.includes("UTF-8_Q") || filename.length > 200) {
        filename = "blacklist-report.xlsx";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
