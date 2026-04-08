import type { Member, MemberStreamerProfileFields } from "@/components/members/memberTypes";
import { defaultApiRequestInit } from "@/lib/http/requestInit";

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
    /** Spring: MemberSearchCondition.statusCode */
    statusCode?: string;
    /** 검색 폼용 — 정규화 시 statusCode 로 합쳐 전송 */
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
    nickname?: string;
    memberPwd?: string;
    birthYmd?: string;
    email?: string;
    profileImageUrl?: string | null;
    /** attach_file.file_seq */
    profileImageFileSeq?: number | null;
    gender?: string;
    phone?: string;
    region?: string;
    /** 레거시·호환(백엔드 기본은 roleCodes / roleCodesDisplay) */
    roleCode?: string;
    roleName?: string;
    roleCodes?: string[];
    roleCodesDisplay?: string;
    status?: string;
    statusCode?: string;
    statusName?: string;
    createDt?: string;
    modifyDt?: string;
    lastLoginAt?: string;
};

export type MemberStreamerProfileResponse = {
    memberStreamerProfileSeq?: number;
    memberSeq?: number;
    instagramUrl?: string | null;
    youtubeUrl?: string | null;
    soopChannelUrl?: string | null;
    companyCategoryCode?: string | null;
    bloodType?: string | null;
    careerHistory?: string | null;
};

export type MemberDetailResponse = {
    memberSeq?: number;
    memberId?: string;
    memberName?: string;
    nickname?: string;
    memberPwd?: string;
    birthYmd?: string;
    email?: string;
    profileImageUrl?: string | null;
    /** attach_file.file_seq */
    profileImageFileSeq?: number | null;
    gender?: string;
    phone?: string;
    region?: string;
    roleCode?: string;
    roleName?: string;
    roleCodes?: string[];
    roleCodesDisplay?: string;
    gradeCode?: string;
    statusCode?: string;
    status?: string;
    statusName?: string;
    createDt?: string;
    modifyDt?: string;
    lastLoginAt?: string;
    lastLoginIp?: string;
    /** GOOGLE | NAVER | KAKAO — 있으면 소셜 연동 회원 */
    oauthProvider?: string;
    oauthSyncDt?: string;
    streamerProfile?: MemberStreamerProfileResponse | null;
};

/** 목록/상세 공통: 첫 시스템 역할 코드 (백엔드는 roleCodes 배열 또는 roleCodesDisplay) */
export function memberPrimaryRoleCode(m: {
    roleCodes?: string[];
    roleCodesDisplay?: string;
    roleCode?: string;
}): string {
    const fromList = m.roleCodes?.find((c) => (c ?? "").trim());
    if (fromList) return fromList.trim();
    const disp = m.roleCodesDisplay?.trim();
    if (disp) {
        const first = disp.split(",")[0]?.trim();
        if (first) return first;
    }
    return (m.roleCode ?? "").trim();
}

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

export async function searchMembers(condition: MemberSearchCondition): Promise<PageResponse<MemberListItemResponse>> {
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
        ...defaultApiRequestInit,
        method: "GET",
    });

    if (!res.ok) {
        throw new Error("권한 목록 조회 실패");
    }

    const data = (await res.json()) as { items?: RoleItem[]; data?: RoleItem[] };
    return data.items ?? data.data ?? [];
}

function toStreamerPayload(sp: MemberStreamerProfileFields | null | undefined) {
    const s = sp ?? {};
    return {
        instagramUrl: s.instagramUrl ?? "",
        youtubeUrl: s.youtubeUrl ?? "",
        soopChannelUrl: s.soopChannelUrl ?? "",
        companyCategoryCode: s.companyCategoryCode ?? "",
        bloodType: s.bloodType ?? "",
        careerHistory: s.careerHistory ?? "",
    };
}

export async function saveMember(member: Member, mode: "create" | "edit") {
    const rc = (member.roleCode ?? "").trim();
    const payload = {
        memberSeq: member.memberSeq,
        memberId: member.memberId,
        memberName: member.memberName,
        nickname: member.nickname ?? "",
        memberPwd: mode === "edit" && !member.memberPwd?.trim() ? undefined : member.memberPwd,
        birthYmd: member.birthYmd ?? "",
        gender: member.gender ?? "M",
        phone: member.phone ?? "",
        email: member.email ?? "",
        profileImageUrl: member.profileImageUrl ?? null,
        profileImageFileSeq: member.profileImageFileSeq ?? null,
        roleCodes: rc ? [rc] : [],
        statusCode: member.status ?? "ACTIVE",
        streamerProfile: toStreamerPayload(member.streamerProfile),
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

export async function findMemberByMemberId(memberId: string): Promise<MemberDetailResponse | null> {
    const list = await searchMembers({
        memberId,
        page: 1,
        size: 1,
        sortBy: "memberSeq",
        sortDir: "desc",
    });
    const first = list.items?.[0];
    if (!first?.memberSeq) return null;
    return fetchMemberDetail(first.memberSeq);
}

export async function updateMyInfo(member: MemberDetailResponse): Promise<void> {
    const payload = {
        memberSeq: member.memberSeq,
        memberId: member.memberId ?? "",
        memberName: member.memberName ?? "",
        nickname: member.nickname ?? "",
        memberPwd: undefined,
        birthYmd: (member.birthYmd ?? "").replaceAll("-", ""),
        gender: member.gender ?? "M",
        phone: member.phone ?? "",
        email: member.email ?? "",
        profileImageUrl: member.profileImageUrl ?? null,
        profileImageFileSeq: member.profileImageFileSeq ?? null,
        gradeCode: member.gradeCode ?? "NORMAL",
        statusCode: member.statusCode ?? "ACTIVE",
        roleCodes: member.roleCodes ?? ["USER"],
    };

    await apiFetch<void>("/api/members/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiFetch<void>("/api/members/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
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
