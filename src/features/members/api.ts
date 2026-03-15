import type { Member } from "@/components/members/MemberFormModal";

export type RoleItem = {
    roleId?: number;
    roleName?: string;
    roleCode?: string;
    useYn?: string;
};

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

export type MemberSearchCondition = {
    memberId?: string;
    memberName?: string;
    roleCode?: string;
    status?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

export type MemberListItemResponse = {
    memberSeq?: number;
    memberId?: string;
    memberName?: string;
    memberPwd?: string;
    birthYmd?: string;
    email?: string;
    gender?: string;
    phone?: string;
    region?: string;
    roleCode?: string;
    roleName?: string;
    status?: string;
    createDt?: string;
    modifyDt?: string;
    lastLoginAt?: string;
};

export type MemberDetailResponse = {
    memberSeq?: number;
    memberId?: string;
    memberName?: string;
    memberPwd?: string;
    birthYmd?: string;
    email?: string;
    gender?: string;
    phone?: string;
    region?: string;
    roleCode?: string;
    roleName?: string;
    status?: string;
    createDt?: string;
    modifyDt?: string;
    lastLoginAt?: string;
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

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(input, {
        cache: "no-store",
        ...init,
    });

    let json: ApiResponse<T> | null = null;

    try {
        json = (await res.json()) as ApiResponse<T>;
    } catch {
        if (!res.ok) {
            throw new ApiError("요청 처리 중 오류가 발생했습니다.", {
                status: res.status,
            });
        }
        throw new ApiError("응답 형식이 올바르지 않습니다.", {
            status: res.status,
        });
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

export async function searchMembers(
    condition: MemberSearchCondition
): Promise<PageResponse<MemberListItemResponse>> {
    const result = await apiFetch<PageResponse<MemberListItemResponse>>("/api/members/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(condition),
    });

    return result.data;
}

export async function fetchMemberDetail(memberSeq: number): Promise<MemberDetailResponse> {
    const result = await apiFetch<MemberDetailResponse>(`/api/members/detail/${memberSeq}`);
    return result.data;
}

export async function fetchRoles(): Promise<RoleItem[]> {
    const res = await fetch("/api/roles", {
        method: "GET",
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("권한 목록 조회 실패");
    }

    const data = (await res.json()) as { items?: RoleItem[]; data?: RoleItem[] };
    return data.items ?? data.data ?? [];
}

export async function saveMember(member: Member, mode: "create" | "edit") {
    const payload = {
        memberSeq: member.memberSeq,
        memberId: member.memberId,
        memberName: member.memberName,
        memberPwd:
            mode === "edit" && !member.memberPwd?.trim() ? undefined : member.memberPwd,
        birthYmd: member.birthYmd ?? "",
        gender: member.gender ?? "M",
        phone: member.phone ?? "",
        email: member.email ?? "",
        roleCode: member.roleCode ?? "",
        status: member.status ?? "ACTIVE",
    };

    if (mode === "create") {
        return apiFetch<void>("/api/members/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
    }

    return apiFetch<void>("/api/members/update", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}

export async function deleteMembers(memberSeqList: number[]) {
    await Promise.all(
        memberSeqList.map((memberSeq) =>
            apiFetch<void>(`/api/members/delete/${memberSeq}`, {
                method: "DELETE",
            })
        )
    );
}