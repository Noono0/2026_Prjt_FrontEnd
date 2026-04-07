import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { buildPublicApiUrl } from "@/lib/public-api";

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
    return buildPublicApiUrl(path);
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

/** JSON.stringify 는 값이 undefined 인 키를 제거함 → 서버에 menuId 누락 시 중복코드 검사 오동작 */
function jsonId(n: number | undefined | null): number | null {
    if (n === undefined || n === null) return null;
    const x = Number(n);
    return Number.isFinite(x) ? x : null;
}

export async function saveMenu(row: MenuRow, mode: "create" | "edit") {
    if (mode === "edit") {
        const id = row.menuId;
        if (id === undefined || id === null || !Number.isFinite(Number(id))) {
            throw new ApiError(
                "메뉴 ID가 없어 수정할 수 없습니다. 목록을 새로고침한 뒤 다시 시도해 주세요."
            );
        }
    }

    const payload = {
        menuId: mode === "edit" ? Number(row.menuId) : jsonId(row.menuId),
        menuCode: String(row.menuCode ?? "").trim(),
        menuName: String(row.menuName ?? "").trim(),
        menuPath: (row.menuPath ?? "").trim(),
        parentMenuId: jsonId(row.parentMenuId),
        sortOrder: Number(row.sortOrder ?? 0),
        useYn: row.useYn === "N" ? "N" : "Y",
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

/** 트리 드래그 전용 — 부모/정렬만 갱신 (메뉴코드 중복 검사 없음) */
export type MenuReorderPayload = {
    menuId: number;
    parentMenuId: number | null;
    sortOrder: number;
};

export async function reorderMenus(items: MenuReorderPayload[]) {
    const body = items.map((i) => ({
        menuId: i.menuId,
        parentMenuId: i.parentMenuId == null ? null : i.parentMenuId,
        sortOrder: i.sortOrder,
    }));
    return apiFetch<number>("/api/menus/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}
