import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { ApiError } from "@/features/boards/api";
import type { SitePopupListItem, SitePopupSearchCondition } from "./types";

type ApiResponse<T> = {
    success: boolean;
    code?: string;
    message?: string;
    data: T;
};

type PageResponse<T> = {
    items: T[];
    page: number;
    size: number;
    totalCount: number;
};

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(input, {
        ...defaultApiRequestInit,
        ...init,
    });

    let json: ApiResponse<T> | null = null;

    try {
        json = (await res.json()) as ApiResponse<T>;
    } catch {
        throw new ApiError("응답 형식이 올바르지 않습니다.");
    }

    if (!res.ok || !json.success) {
        throw new ApiError(json?.message ?? "요청 처리 중 오류가 발생했습니다.");
    }

    return json;
}

export async function searchSitePopups(condition: SitePopupSearchCondition): Promise<PageResponse<SitePopupListItem>> {
    const result = await apiFetch<PageResponse<SitePopupListItem>>("/api/site-popups/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });
    return result.data;
}

export async function fetchSitePopupDetail(sitePopupSeq: number): Promise<SitePopupListItem> {
    const result = await apiFetch<SitePopupListItem>(`/api/site-popups/detail/${sitePopupSeq}`, {
        method: "GET",
    });
    return result.data;
}

export async function createSitePopup(body: Record<string, unknown>): Promise<number> {
    const result = await apiFetch<number>("/api/site-popups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return result.data ?? 0;
}

export async function updateSitePopup(body: Record<string, unknown>): Promise<number> {
    const result = await apiFetch<number>("/api/site-popups/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return result.data ?? 0;
}

export async function deleteSitePopup(sitePopupSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/site-popups/delete/${sitePopupSeq}`, {
        method: "DELETE",
    });
    return result.data ?? 0;
}
