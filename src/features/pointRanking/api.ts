import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { ApiError } from "@/features/boards/api";

export type PointRankingReasonBreakdown = {
    reasonCode: string;
    reasonLabel: string;
    points: number;
};

export type PointRankingEntry = {
    rank: number;
    memberSeq: number;
    memberId: string;
    /** 닉네임 또는 닉네임 미설정 시 아이디 */
    displayLabel: string;
    pointsEarned: number;
    breakdown?: PointRankingReasonBreakdown[];
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data: T;
};

async function apiFetch<T>(input: string): Promise<ApiResponse<T>> {
    const res = await fetch(input, { ...defaultApiRequestInit, cache: "no-store" });
    let json: ApiResponse<T> | null = null;
    try {
        json = (await res.json()) as ApiResponse<T>;
    } catch {
        throw new ApiError("응답 형식이 올바르지 않습니다.");
    }
    if (!res.ok || !json.success) {
        throw new ApiError(json?.message ?? "요청 처리 중 오류가 발생했습니다.");
    }
    return json;
}

export async function fetchPointRanking(period: "DAY" | "WEEK" | "MONTH"): Promise<PointRankingEntry[]> {
    const result = await apiFetch<PointRankingEntry[]>(`/api/members/point-ranking?period=${period}`);
    return result.data ?? [];
}
