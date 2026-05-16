import { ApiError, type ApiResponse } from "@/features/profile/api";
import { defaultApiRequestInit } from "@/lib/http/requestInit";

export type SoopLiveStatusItem = {
    isLive: boolean;
    liveRoomId: string | null;
};

export type SoopLiveStatusBatchResponse = {
    statuses: Record<string, SoopLiveStatusItem>;
};

export function normalizeSoopLink(link: string): string {
    const trimmed = link.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

export function isLiveBadgeEnabled(): boolean {
    return process.env.NEXT_PUBLIC_LIVE_BADGE_ENABLED !== "false";
}

export async function fetchSoopLiveStatuses(links: string[]): Promise<SoopLiveStatusBatchResponse> {
    const unique = Array.from(new Set(links.map(normalizeSoopLink).filter((link) => link.length > 0)));
    if (unique.length === 0) {
        return { statuses: {} };
    }

    const res = await fetch("/api/soop-live/status", {
        ...defaultApiRequestInit,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: unique }),
    });

    let json: ApiResponse<SoopLiveStatusBatchResponse> | null = null;
    try {
        json = (await res.json()) as ApiResponse<SoopLiveStatusBatchResponse>;
    } catch {
        throw new ApiError("LIVE 상태 응답 형식이 올바르지 않습니다.", { status: res.status });
    }

    if (!res.ok || !json?.success) {
        throw new ApiError(json?.message ?? "LIVE 상태를 불러오지 못했습니다.", {
            code: json?.code,
            status: res.status,
        });
    }

    return json.data ?? { statuses: {} };
}
