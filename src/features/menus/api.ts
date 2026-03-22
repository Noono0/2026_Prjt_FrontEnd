import { defaultApiRequestInit } from "@/lib/http/requestInit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

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

export type MenuSearchCondition = {
    menuId?: number;
    menuCode?: string;
    menuName?: string;
    parentMenuId?: number;
    useYn?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

export type MenuRow = {
    menuId?: number;
    menuCode?: string;
    menuName?: string;
    menuPath?: string;
    parentMenuId?: number;
    sortOrder?: number;
    useYn?: string;
};

export class ApiError extends Error {
    code?: string;
    errors?: FieldErrorResponse[];
    status?: number;

    constructor(
        message: string,
        options?: { code?: string; errors?: FieldErrorResponse[]; status?: number }
    ) {
        super(message);
        this.name = "ApiError";
        this.code = options?.code;
        this.errors = options?.errors;
        this.status = options?.status;
    }
}

function buildApiUrl(path: string): string {
    return `${API_BASE_URL}${path}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(buildApiUrl(path), {
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
        throw new ApiError(json?.message ?? "요청 처리 중 오류가 발생했습니다.", {
            code: json?.code,
            errors: json?.errors ?? [],
            status: res.status,
        });
    }

    return json;
}

export async function searchMenus(
    condition: MenuSearchCondition
): Promise<PageResponse<MenuRow>> {
    const result = await apiFetch<PageResponse<MenuRow>>("/api/menus/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });
    return result.data;
}

/** 트리 UI용 전체 메뉴 (페이징 없음) */
export async function fetchMenuTree(): Promise<MenuRow[]> {
    const result = await apiFetch<MenuRow[]>("/api/menus/tree", {
        method: "GET",
    });
    return result.data ?? [];
}

export async function fetchMenuDetail(menuId: number): Promise<MenuRow> {
    const result = await apiFetch<MenuRow>("/api/menus/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId }),
    });
    return result.data;
}

export async function saveMenu(row: MenuRow, mode: "create" | "edit") {
    const payload = {
        menuId: row.menuId,
        menuCode: row.menuCode ?? "",
        menuName: row.menuName ?? "",
        menuPath: row.menuPath ?? "",
        parentMenuId: row.parentMenuId,
        sortOrder: row.sortOrder ?? 0,
        useYn: row.useYn ?? "Y",
    };
    if (mode === "create") {
        return apiFetch<number>("/api/menus/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }
    return apiFetch<number>("/api/menus/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function deleteMenu(menuId: number) {
    return apiFetch<number>("/api/menus/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId }),
    });
}
