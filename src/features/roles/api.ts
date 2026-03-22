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

export type RoleSearchCondition = {
    roleId?: number;
    roleCode?: string;
    roleName?: string;
    useYn?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

export type RoleRow = {
    roleId?: number;
    roleCode?: string;
    roleName?: string;
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

export async function searchRoles(
    condition: RoleSearchCondition
): Promise<PageResponse<RoleRow>> {
    const result = await apiFetch<PageResponse<RoleRow>>("/api/roles/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });
    return result.data;
}

export async function fetchRoleDetail(roleId: number): Promise<RoleRow> {
    const result = await apiFetch<RoleRow>("/api/roles/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
    });
    return result.data;
}

export async function saveRole(row: RoleRow, mode: "create" | "edit") {
    const payload = {
        roleId: row.roleId,
        roleCode: row.roleCode ?? "",
        roleName: row.roleName ?? "",
        useYn: row.useYn ?? "Y",
    };
    if (mode === "create") {
        return apiFetch<number>("/api/roles/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }
    return apiFetch<number>("/api/roles/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function deleteRole(roleId: number) {
    return apiFetch<number>("/api/roles/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
    });
}
