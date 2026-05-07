import { defaultApiRequestInit } from "@/lib/http/requestInit";

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
    totalPages?: number;
};

export type GamniverseProfileDto = {
    gamniverseProfileSeq?: number;
    profileName?: string;
    sortOrder?: number;
    rankCode?: string;
    affiliationCode?: string;
    broadcastLink?: string;
    soopBroadcastLink?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    cafeLink?: string;
    profileImageFileSeq?: number | null;
    profileRowsJson?: string;
    isLive?: boolean;
    liveRoomId?: string | null;
    useYn?: string;
};

export type GamniverseProfileSearchCondition = {
    profileName?: string;
    affiliationCode?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

export type GamniverseProfileSaveRequest = {
    gamniverseProfileSeq?: number;
    profileName: string;
    sortOrder: number;
    rankCode: string;
    affiliationCode: string;
    broadcastLink: string;
    soopBroadcastLink: string;
    instagramUrl: string;
    youtubeUrl: string;
    cafeLink: string;
    profileImageFileSeq?: number | null;
    profileRowsJson: string;
    useYn?: string;
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

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(input, {
        ...defaultApiRequestInit,
        ...init,
    });
    let json: ApiResponse<T> | null = null;
    try {
        json = (await res.json()) as ApiResponse<T>;
    } catch {
        throw new ApiError("응답 형식이 올바르지 않습니다.", { status: res.status });
    }
    if (!res.ok || !json.success) {
        throw new ApiError(json?.message ?? "요청 처리 중 오류가 발생했습니다.", {
            code: json?.code,
            errors: json?.errors ?? [],
            status: res.status,
        });
    }
    return json;
}

export async function searchGamniverseProfiles(
    condition: GamniverseProfileSearchCondition
): Promise<PageResponse<GamniverseProfileDto>> {
    const result = await apiFetch<PageResponse<GamniverseProfileDto>>("/api/gamniverse-profiles/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });
    return result.data;
}

export async function createGamniverseProfile(request: GamniverseProfileSaveRequest): Promise<void> {
    await apiFetch<number>("/api/gamniverse-profiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });
}

export async function updateGamniverseProfile(request: GamniverseProfileSaveRequest): Promise<void> {
    await apiFetch<number>("/api/gamniverse-profiles/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });
}

export async function deleteGamniverseProfile(seq: number): Promise<void> {
    await apiFetch<number>(`/api/gamniverse-profiles/delete/${seq}`, {
        method: "DELETE",
    });
}
