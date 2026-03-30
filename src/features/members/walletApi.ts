import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { ApiError } from "@/features/boards/api";

export type WalletRates = {
    pointsPerIron: number;
    ironPerSilver: number;
    silverPerGold: number;
    goldPerDiamond: number;
};

export type MemberWalletSummary = {
    memberSeq?: number;
    pointBalance?: number;
    ironQty?: number;
    silverQty?: number;
    goldQty?: number;
    diamondQty?: number;
    rates?: WalletRates;
};

export type WalletLedgerRow = {
    ledgerSeq?: number;
    reasonCode?: string;
    summary?: string;
    pointDelta?: number;
    ironDelta?: number;
    silverDelta?: number;
    goldDelta?: number;
    diamondDelta?: number;
    createDt?: string;
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data: T;
};

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(input, {
        ...defaultApiRequestInit,
        ...init,
    });
    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok || !json.success) {
        throw new ApiError(json?.message ?? "요청 처리 중 오류가 발생했습니다.");
    }
    return json;
}

export async function fetchMyWallet(): Promise<MemberWalletSummary> {
    const r = await apiFetch<MemberWalletSummary>("/api/members/me/wallet", { method: "GET" });
    return r.data;
}

export type WalletLedgerPage = {
    items: WalletLedgerRow[];
    page: number;
    size: number;
    totalCount: number;
};

export async function fetchMyWalletLedger(page = 1, size = 20): Promise<WalletLedgerPage> {
    const q = new URLSearchParams({ page: String(page), size: String(size) });
    const r = await apiFetch<WalletLedgerPage>(`/api/members/me/wallet/ledger?${q.toString()}`, {
        method: "GET",
    });
    return r.data;
}

export async function purchaseIron(quantity: number): Promise<void> {
    await apiFetch<unknown>("/api/members/me/wallet/purchase-iron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
    });
}

export async function exchangeIronToSilver(times: number): Promise<void> {
    await apiFetch<unknown>("/api/members/me/wallet/exchange/iron-silver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: times }),
    });
}

export async function exchangeSilverToGold(times: number): Promise<void> {
    await apiFetch<unknown>("/api/members/me/wallet/exchange/silver-gold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: times }),
    });
}

export async function exchangeGoldToDiamond(times: number): Promise<void> {
    await apiFetch<unknown>("/api/members/me/wallet/exchange/gold-diamond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: times }),
    });
}

export async function giftPoints(toMemberSeq: number, points: number): Promise<void> {
    await apiFetch<unknown>("/api/members/me/wallet/gift-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toMemberSeq, points }),
    });
}
