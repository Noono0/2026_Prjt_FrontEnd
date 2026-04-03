import { defaultApiRequestInit } from "@/lib/http/requestInit";
import type { BoardListItem } from "@/features/boards/types";
import type { ApiResponse, PageResponse } from "@/features/boards/api";
import type { BoardCategoryOption } from "@/features/boards/types";

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(input, { ...defaultApiRequestInit, ...init });
    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok || !json.success) {
        throw new Error(json?.message ?? "요청 처리 중 오류가 발생했습니다.");
    }
    return json;
}

export async function searchInquiryBoards(payload: Record<string, unknown>): Promise<PageResponse<BoardListItem>> {
    const res = await apiFetch<PageResponse<BoardListItem>>("/api/inquiry-boards/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return res.data;
}

export async function fetchInquiryCategories(): Promise<BoardCategoryOption[]> {
    const res = await apiFetch<BoardCategoryOption[]>("/api/inquiry-boards/categories", { method: "GET" });
    return res.data ?? [];
}

export async function fetchInquiryBoardDetail(boardSeq: number, password?: string): Promise<BoardListItem> {
    const q = password ? `?password=${encodeURIComponent(password)}` : "";
    const res = await apiFetch<BoardListItem>(`/api/inquiry-boards/detail/${boardSeq}${q}`, { method: "GET" });
    return res.data;
}

export async function createInquiryBoard(payload: Record<string, unknown>): Promise<number> {
    const res = await apiFetch<number>("/api/inquiry-boards/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return Number(res.data ?? 0);
}

export async function updateInquiryBoard(payload: Record<string, unknown>): Promise<number> {
    const res = await apiFetch<number>("/api/inquiry-boards/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return Number(res.data ?? 0);
}

export async function deleteMyInquiryBoard(boardSeq: number): Promise<number> {
    const res = await apiFetch<number>(`/api/inquiry-boards/mine/${boardSeq}`, {
        method: "DELETE",
    });
    return Number(res.data ?? 0);
}

