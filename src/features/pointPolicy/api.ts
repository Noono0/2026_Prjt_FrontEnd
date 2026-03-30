import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { ApiError } from "@/features/boards/api";

export type PointPolicyRow = {
    policyKey: string;
    useYn: string;
    rewardPoints?: number | null;
    thresholdInt?: number | null;
    capInt?: number | null;
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data: T;
};

async function parse<T>(res: Response): Promise<ApiResponse<T>> {
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

export async function fetchPointPolicies(): Promise<PointPolicyRow[]> {
    const res = await fetch("/api/point-policy", { ...defaultApiRequestInit, cache: "no-store" });
    const json = await parse<PointPolicyRow[]>(res);
    return json.data;
}

export async function savePointPolicies(rows: PointPolicyRow[]): Promise<void> {
    const res = await fetch("/api/point-policy", {
        ...defaultApiRequestInit,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
    });
    await parse<string>(res);
}
