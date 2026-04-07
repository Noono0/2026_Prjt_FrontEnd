import { ApiError, type ApiResponse, type RoleRow } from "@/features/roles/api";
import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { buildPublicApiUrl } from "@/lib/public-api";

export type RoleMenuAssignment = {
    menuId: number;
    menuCode: string;
    menuName: string;
    menuPath?: string;
    parentMenuId?: number | null;
    sortOrder?: number;
    roleMenuId?: number | null;
    canRead: string;
    canCreate: string;
    canUpdate: string;
    canDelete: string;
};

export type RoleMenuMappingSaveItem = {
    menuId: number;
    canRead: string;
    canCreate: string;
    canUpdate: string;
    canDelete: string;
};

function buildApiUrl(path: string): string {
    return buildPublicApiUrl(path);
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(buildApiUrl(path), {
        cache: "no-store",
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

/** GET /api/roles — 기존 호환 (items/total) */
export async function fetchActiveRoles(): Promise<RoleRow[]> {
    const res = await fetch(buildApiUrl("/api/roles"), { ...defaultApiRequestInit });
    if (!res.ok) {
        throw new ApiError("권한 목록을 불러오지 못했습니다.", { status: res.status });
    }
    const json = (await res.json()) as { items?: RoleRow[] };
    return json.items ?? [];
}

export async function fetchRoleMenuAssignments(roleId: number): Promise<RoleMenuAssignment[]> {
    const result = await apiFetch<RoleMenuAssignment[]>("/api/roles/menu-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
    });
    return result.data ?? [];
}

export async function saveRoleMenuMappings(payload: {
    roleId: number;
    items: RoleMenuMappingSaveItem[];
}) {
    return apiFetch<null>("/api/roles/menu-mappings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}
