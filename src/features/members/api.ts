import type { Member } from "@/components/members/MemberFormModal";

export type RoleItem = {
    id: number;
    role_name: string;
};

type ApiResponse<T> = {
    success: boolean;
    data: T;
    message?: string | null;
};

type MemberSearchCondition = {
    memberId?: string;
    memberName?: string;
    roleCode?: string;
    status?: string;
};

export type MemberDetailResponse = {
    memberSeq?: number;
    memberId?: string;
    memberName?: string;
    email?: string;
    phone?: string;
    region?: string;
    roleCode?: string;
    status?: string;
    lastLoginAt?: string;
};

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
        cache: "no-store",
        ...init,
    });

    if (!res.ok) {
        let message = "요청 처리 중 오류가 발생했습니다.";
        try {
            const json = await res.json();
            message = json?.message ?? message;
        } catch {}
        throw new Error(message);
    }

    return res.json() as Promise<T>;
}

export async function searchMembers(
    condition: MemberSearchCondition
): Promise<MemberDetailResponse[]> {
    const data = await apiFetch<ApiResponse<MemberDetailResponse[]>>("/api/members/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });

    return data.data ?? [];
}

export async function fetchMemberDetail(memberSeq: number): Promise<MemberDetailResponse> {
    const data = await apiFetch<ApiResponse<MemberDetailResponse>>(
        `/api/members/detail/${memberSeq}`
    );
    return data.data;
}

export async function fetchRoles(): Promise<RoleItem[]> {
    const data = await apiFetch<ApiResponse<RoleItem[]>>("/api/roles");
    return data.data ?? [];
}

export async function saveMember(member: Member, mode: "create" | "edit") {
    if (mode === "create") {
        return apiFetch("/api/members/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(member),
        });
    }

    return apiFetch("/api/members/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
    });
}

export async function deleteMembers(ids: string[]) {
    return apiFetch("/api/members/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
    });
}

// queries.ts 호환용
export async function fetchMembers(condition?: MemberSearchCondition) {
    return searchMembers(condition ?? {});
}