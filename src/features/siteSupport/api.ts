import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { ApiError } from "@/features/boards/api";
import type { SiteSupportRow, SiteSupportSearchCondition } from "./types";

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

export async function fetchSiteSupportActive(): Promise<SiteSupportRow[]> {
    const result = await apiFetch<SiteSupportRow[]>("/api/site-support/active", {
        method: "GET",
    });
    return result.data ?? [];
}

export async function searchSiteSupportRows(
    condition: SiteSupportSearchCondition
): Promise<PageResponse<SiteSupportRow>> {
    const result = await apiFetch<PageResponse<SiteSupportRow>>("/api/site-support/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });
    return result.data;
}

export async function fetchSiteSupportDetail(supportSeq: number): Promise<SiteSupportRow> {
    const result = await apiFetch<SiteSupportRow>(`/api/site-support/detail/${supportSeq}`, {
        method: "GET",
    });
    return result.data;
}

export async function createSiteSupport(body: Record<string, unknown>): Promise<number> {
    const result = await apiFetch<number>("/api/site-support/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return result.data ?? 0;
}

export async function updateSiteSupport(body: Record<string, unknown>): Promise<number> {
    const result = await apiFetch<number>("/api/site-support/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return result.data ?? 0;
}

export async function deleteSiteSupport(supportSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/site-support/delete/${supportSeq}`, {
        method: "DELETE",
    });
    return result.data ?? 0;
}
