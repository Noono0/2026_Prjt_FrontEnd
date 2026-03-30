import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { ApiError } from "@/features/boards/api";
import type { BoardComment } from "@/features/boards/types";
import type {
    NoticeBoardCategoryOption,
    NoticeBoardListItem,
    NoticeBoardSearchCondition,
} from "./types";

type FieldErrorResponse = {
    field: string;
    code: string;
    message: string;
};

type ApiResponse<T> = {
    success: boolean;
    code?: string;
    message?: string;
    data: T;
    errors?: FieldErrorResponse[];
};

type PageResponse<T> = {
    items: T[];
    page: number;
    size: number;
    totalCount: number;
};

export { ApiError };

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

export async function searchNoticeBoards(condition: NoticeBoardSearchCondition): Promise<PageResponse<NoticeBoardListItem>> {
    const result = await apiFetch<PageResponse<NoticeBoardListItem>>("/api/notice-boards/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });
    return result.data;
}

export async function fetchNoticeBoardCategories(): Promise<NoticeBoardCategoryOption[]> {
    const result = await apiFetch<NoticeBoardCategoryOption[]>("/api/notice-boards/categories", {
        method: "GET",
    });
    return result.data ?? [];
}

export async function fetchNoticeBoardsPinnedOnFreeBoard(): Promise<NoticeBoardListItem[]> {
    const result = await apiFetch<NoticeBoardListItem[]>("/api/notice-boards/pin-on-free-board", {
        method: "GET",
    });
    return result.data ?? [];
}

export async function fetchNoticeBoardDetail(noticeBoardSeq: number): Promise<NoticeBoardListItem> {
    const result = await apiFetch<NoticeBoardListItem>(`/api/notice-boards/detail/${noticeBoardSeq}`, {
        method: "GET",
    });
    return result.data;
}

export async function increaseNoticeBoardViewCount(noticeBoardSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/notice-boards/${noticeBoardSeq}/view`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function likeNoticeBoard(noticeBoardSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/notice-boards/${noticeBoardSeq}/like`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function dislikeNoticeBoard(noticeBoardSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/notice-boards/${noticeBoardSeq}/dislike`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function reportNoticeBoard(noticeBoardSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/notice-boards/${noticeBoardSeq}/report`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export type NoticeBoardCommentSavePayload = {
    content: string;
    parentBoardCommentSeq?: number;
    emoticonSeq1?: number;
    emoticonSeq2?: number;
    emoticonSeq3?: number;
};

export async function fetchNoticeBoardComments(
    noticeBoardSeq: number,
    sort: "latest" | "oldest" | "like" = "latest"
): Promise<BoardComment[]> {
    const q = encodeURIComponent(sort);
    const result = await apiFetch<BoardComment[]>(`/api/notice-boards/${noticeBoardSeq}/comments?sort=${q}`, {
        method: "GET",
    });
    return result.data ?? [];
}

export async function createNoticeBoardComment(
    noticeBoardSeq: number,
    payload: NoticeBoardCommentSavePayload
): Promise<number> {
    const result = await apiFetch<number>(`/api/notice-boards/${noticeBoardSeq}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return Number(result.data ?? 0);
}

export async function likeNoticeBoardComment(noticeBoardSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/notice-boards/${noticeBoardSeq}/comments/${commentSeq}/like`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function dislikeNoticeBoardComment(noticeBoardSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/notice-boards/${noticeBoardSeq}/comments/${commentSeq}/dislike`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function reportNoticeBoardComment(noticeBoardSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/notice-boards/${noticeBoardSeq}/comments/${commentSeq}/report`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function updateNoticeBoardComment(
    noticeBoardSeq: number,
    commentSeq: number,
    payload: NoticeBoardCommentSavePayload
): Promise<number> {
    const result = await apiFetch<number>(`/api/notice-boards/${noticeBoardSeq}/comments/${commentSeq}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return result.data ?? 0;
}

export async function deleteNoticeBoardComment(noticeBoardSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/notice-boards/${noticeBoardSeq}/comments/${commentSeq}`, {
        method: "DELETE",
    });
    return result.data ?? 0;
}

export async function updateNoticeBoard(payload: {
    noticeBoardSeq: number;
    categoryCode?: string;
    title: string;
    content: string;
    showYn?: string;
    highlightYn?: string;
    commentAllowedYn?: string;
    replyAllowedYn?: string;
    pinOnFreeBoardYn?: string;
}): Promise<number> {
    const result = await apiFetch<number>("/api/notice-boards/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return result.data ?? 0;
}
