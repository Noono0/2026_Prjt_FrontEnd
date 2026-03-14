import type { Member } from "@/components/members/MemberFormModal";

export type RoleItem = {
    roleId: number;
    roleName: string;
    roleCode: string;
    useYn?: string;
};

type RolesResponse = {
    items: RoleItem[];
    total: number;
};

/**
 * 나중에 필드별 에러 표시할 때 사용할 타입
 * 예:
 * - memberId 중복
 * - status 값 오류
 * - 필수값 누락
 */
export type FieldErrorResponse = {
    field: string;
    code: string;
    message: string;
};

/**
 * 백엔드 공통 응답 형식
 * success / code / message / data / errors 로 통일
 */
export type ApiResponse<T> = {
    success: boolean;
    code: string;
    message: string;
    data: T;
    errors: FieldErrorResponse[];
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

/**
 * API 에러를 프론트에서 더 쉽게 다루기 위한 에러 클래스
 * - message: 백엔드 message
 * - code: 백엔드 code
 * - errors: 필드별 에러 목록
 */
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

/**
 * 공통 fetch
 * - HTTP status 실패도 처리
 * - success=false 응답도 처리
 * - 백엔드 message / code / errors 를 그대로 살려서 throw
 */
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

/**
 * 회원 목록 검색
 * POST /api/members/search
 */
export async function searchMembers(
    condition: MemberSearchCondition
): Promise<MemberDetailResponse[]> {
    const result = await apiFetch<MemberDetailResponse[]>("/api/members/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(condition),
    });

    return result.data ?? [];
}

/**
 * 회원 상세 조회
 * GET /api/members/detail/{memberSeq}
 */
export async function fetchMemberDetail(memberSeq: number): Promise<MemberDetailResponse> {
    const result = await apiFetch<MemberDetailResponse>(`/api/members/detail/${memberSeq}`);
    return result.data;
}

/**
 * 권한 목록 조회
 * 현재 /api/roles 응답도 공통 포맷이라고 가정
 */
export async function fetchRoles(): Promise<RoleItem[]> {
    const res = await fetch("/api/roles", {
        method: "GET",
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("권한 목록 조회 실패");
    }

    const data = (await res.json()) as RolesResponse;
    return data.items ?? [];
}

/**
 * 회원 등록 / 수정
 * - create: POST /api/members/create
 * - edit  : PUT  /api/members/update
 *
 * 성공 시 공통 응답 전체를 반환해 두면
 * 나중에 result.message 활용 가능
 */
export async function saveMember(member: Member, mode: "create" | "edit") {
    if (mode === "create") {
        return apiFetch<void>("/api/members/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(member),
        });
    }

    return apiFetch<void>("/api/members/update", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(member),
    });
}

/**
 * 회원 삭제
 * DELETE /api/members/delete
 *
 * ids 배열을 body 로 보냄
 */
export async function deleteMembers(ids: string[]) {
    return apiFetch<void>("/api/members/delete", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
    });
}

/**
 * 기존 queries.ts 호환용
 * 예전 fetchMembers 이름을 계속 쓰는 곳이 있으면 깨지지 않게 유지
 */
export async function fetchMembers(condition?: MemberSearchCondition) {
    return searchMembers(condition ?? {});
}