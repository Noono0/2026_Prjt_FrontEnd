/**
 * 자유게시판 — 브라우저에서 호출하는 API 래퍼 (Create 제외 대부분이 여기서 나감).
 *
 * [전체 데이터 경로]
 *   React 화면 → fetch("/api/boards/...") → Next `src/app/api/boards/.../route.ts`
 *   → Spring `API_BASE_URL` → DB
 *
 * [CRUD 빠른 매핑]
 *   C  POST /api/boards/create     → BoardWritePage.tsx 안에서만 직접 fetch (이 파일에 함수 없음)
 *   R  POST /api/boards/search     → searchBoards()      → BoardsPage
 *   R  GET  /api/boards/detail/:id → fetchBoardDetail()  → BoardDetailPage
 *   U  PUT  /api/boards/update     → updateBoard()       → BoardDetailPage 저장
 *   D  DEL  /api/boards/mine/:id   → deleteMyBoard()     → BoardDetailPage 삭제
 *
 * 상세 설명: 같은 폴더의 `CRUD_FLOW.md`
 */
import { devLog } from "@/lib/devLog";
import { defaultApiRequestInit } from "@/lib/http/requestInit";
import type {
    BoardCategoryOption,
    BoardComment,
    BoardListItem,
    BoardPopularConfig,
    BoardSearchCondition,
    MemberEmoticon,
} from "./types";

export type FieldErrorResponse = {
    field: string;
    code: string;
    message: string;
};

export type ApiResponse<T> = {
    success: boolean;
    code?: string;
    message?: string;
    data: T;
    errors?: FieldErrorResponse[];
};

export type PageResponse<T> = {
    items: T[];
    page: number;
    size: number;
    totalCount: number;
};

export class ApiError extends Error {
    code?: string;
    errors?: FieldErrorResponse[];
    status?: number;

    constructor(message: string, options?: { code?: string; errors?: FieldErrorResponse[]; status?: number }) {
        super(message);
        this.name = "ApiError";
        this.code = options?.code;
        this.errors = options?.errors;
        this.status = options?.status;
    }
}

/** 공통: fetch 후 JSON 파싱, success가 아니면 ApiError. Network 탭에서 동일 URL 확인 가능. */
async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResponse<T>> {
    devLog("자유게시판-api", "요청", String(input), init?.method ?? "GET");

    const res = await fetch(input, {
        ...defaultApiRequestInit,
        ...init,
    });

    let json: ApiResponse<T> | null = null;

    try {
        json = (await res.json()) as ApiResponse<T>;
    } catch {
        if (!res.ok) {
            throw new ApiError("요청 처리 중 오류가 발생했습니다.", { status: res.status });
        }
        throw new ApiError("응답 형식이 올바르지 않습니다.", { status: res.status });
    }

    if (!res.ok || !json.success) {
        devLog("자유게시판-api", "실패", { status: res.status, message: json?.message });
        throw new ApiError(json?.message ?? "요청 처리 중 오류가 발생했습니다.", {
            code: json?.code,
            errors: json?.errors ?? [],
            status: res.status,
        });
    }

    devLog("자유게시판-api", "성공", String(input), "success");
    return json;
}

/** Read·목록 — 검색/페이지 조건을 JSON으로 보냄 (GET이 아닌 POST인 이유: 조건 객체가 길 수 있어서) */
export async function searchBoards(condition: BoardSearchCondition): Promise<PageResponse<BoardListItem>> {
    const result = await apiFetch<PageResponse<BoardListItem>>("/api/boards/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });
    return result.data;
}

export async function fetchBoardCategories(): Promise<BoardCategoryOption[]> {
    const result = await apiFetch<BoardCategoryOption[]>("/api/boards/categories", {
        method: "GET",
    });
    return result.data ?? [];
}

export async function fetchBoardPopularConfig(): Promise<BoardPopularConfig> {
    const result = await apiFetch<BoardPopularConfig>("/api/boards/popular-config", {
        method: "GET",
    });
    const d = result.data;
    return {
        threshold: typeof d?.threshold === "number" ? d.threshold : 50,
        badgeLabel: (d?.badgeLabel ?? "인기글").trim() || "인기글",
    };
}

/** Read·상세 — 글 번호(boardSeq) 하나로 본문까지 조회 */
export async function fetchBoardDetail(boardSeq: number): Promise<BoardListItem> {
    const result = await apiFetch<BoardListItem>(`/api/boards/detail/${boardSeq}`, {
        method: "GET",
    });
    return result.data;
}

export async function increaseBoardViewCount(boardSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/${boardSeq}/view`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function likeBoard(boardSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/${boardSeq}/like`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function dislikeBoard(boardSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/${boardSeq}/dislike`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function reportBoard(boardSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/${boardSeq}/report`, {
        method: "POST",
    });
    return result.data ?? 0;
}

/** Delete — 본인 글만 삭제 (백엔드에서 권한 검사) */
export async function deleteMyBoard(boardSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/mine/${boardSeq}`, {
        method: "DELETE",
    });
    return result.data ?? 0;
}

/** Update — 수정 시 boardSeq + 제목/내용/노출·댓글 설정 등 한 번에 전송 */
export async function updateBoard(payload: {
    boardSeq: number;
    categoryCode?: string;
    title: string;
    content: string;
    showYn?: string;
    highlightYn?: string;
    commentAllowedYn?: string;
    replyAllowedYn?: string;
}): Promise<number> {
    const result = await apiFetch<number>("/api/boards/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return result.data ?? 0;
}

export type BoardCommentSavePayload = {
    content: string;
    parentBoardCommentSeq?: number;
    emoticonSeq1?: number;
    emoticonSeq2?: number;
    emoticonSeq3?: number;
};

export async function fetchBoardComments(
    boardSeq: number,
    sort: "latest" | "oldest" | "like" = "latest"
): Promise<BoardComment[]> {
    const q = encodeURIComponent(sort);
    const result = await apiFetch<BoardComment[]>(`/api/boards/${boardSeq}/comments?sort=${q}`, {
        method: "GET",
    });
    return result.data ?? [];
}

export async function createBoardComment(boardSeq: number, payload: BoardCommentSavePayload): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/${boardSeq}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return Number(result.data ?? 0);
}

export async function likeBoardComment(boardSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/${boardSeq}/comments/${commentSeq}/like`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function dislikeBoardComment(boardSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/${boardSeq}/comments/${commentSeq}/dislike`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function reportBoardComment(boardSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/${boardSeq}/comments/${commentSeq}/report`, {
        method: "POST",
    });
    return result.data ?? 0;
}

export async function updateBoardComment(
    boardSeq: number,
    commentSeq: number,
    payload: BoardCommentSavePayload
): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/${boardSeq}/comments/${commentSeq}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return result.data ?? 0;
}

export async function deleteBoardComment(boardSeq: number, commentSeq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/boards/${boardSeq}/comments/${commentSeq}`, {
        method: "DELETE",
    });
    return result.data ?? 0;
}

export async function fetchMyMemberEmoticons(): Promise<MemberEmoticon[]> {
    const result = await apiFetch<MemberEmoticon[]>("/api/members/me/emoticons", {
        method: "GET",
    });
    return result.data ?? [];
}
