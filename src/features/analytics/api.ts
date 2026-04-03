import { defaultApiRequestInit } from "@/lib/http/requestInit";

export type VisitorCountPoint = {
    label: string;
    visitors: number;
};

export type VisitorOverview = {
    onlineCount: number;
    heartbeatTtlSeconds: number;
    daily: VisitorCountPoint[];
    weekly: VisitorCountPoint[];
    monthly: VisitorCountPoint[];
};

type ApiEnvelope<T> = { success: boolean; message?: string; data?: T };

function getOrCreateVisitorKey() {
    if (typeof window === "undefined") return "";
    const keyName = "visitorKey";
    const existing = window.localStorage.getItem(keyName)?.trim();
    if (existing) return existing;
    const created = `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(keyName, created);
    return created;
}

export async function sendVisitorHeartbeat(): Promise<void> {
    const visitorKey = getOrCreateVisitorKey();
    if (!visitorKey) return;
    const res = await fetch("/api/analytics/heartbeat", {
        ...defaultApiRequestInit,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorKey }),
    });
    const json = (await res.json()) as ApiEnvelope<unknown>;
    if (!res.ok || !json.success) {
        throw new Error(json.message ?? "heartbeat 전송 실패");
    }
}

export async function fetchVisitorOverview(params?: {
    days?: number;
    weeks?: number;
    months?: number;
}): Promise<VisitorOverview> {
    const sp = new URLSearchParams();
    sp.set("days", String(params?.days ?? 30));
    sp.set("weeks", String(params?.weeks ?? 12));
    sp.set("months", String(params?.months ?? 12));

    const res = await fetch(`/api/analytics/overview?${sp.toString()}`, {
        ...defaultApiRequestInit,
        method: "GET",
    });
    const json = (await res.json()) as ApiEnvelope<VisitorOverview>;
    if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "방문자 통계 조회 실패");
    }
    return json.data;
}
