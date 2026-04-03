import { defaultApiRequestInit } from "@/lib/http/requestInit";

export type EventBattleOption = {
    eventBattleOptionSeq?: number;
    eventBattleSeq?: number;
    sortOrder?: number;
    label?: string;
    pointsTotal?: number;
    voteCount?: number;
};

export type EventBattleListItem = {
    eventBattleSeq?: number;
    title?: string;
    status?: string;
    voteLimitPerMember?: number;
    /** Y: 투표 전용 이벤트 */
    voteOnlyYn?: string;
    winnerOptionSeq?: number | null;
    winnerLabel?: string | null;
    creatorMemberSeq?: number;
    creatorMemberId?: string;
    creatorDisplayName?: string;
    creatorProfileImageUrl?: string;
    optionLabelsPreview?: string;
    createDt?: string;
    settleDt?: string | null;
    options?: EventBattleOption[];
};

export type EventBattleBetRow = {
    eventBattleBetSeq?: number;
    memberSeq?: number;
    memberDisplayName?: string;
    eventBattleOptionSeq?: number;
    optionLabel?: string;
    pointAmount?: number;
    createDt?: string;
};

export type EventBattleMyBet = {
    eventBattleOptionSeq?: number;
    label?: string;
    pointAmount?: number;
};

export type EventBattleBettorRank = {
    rank?: number;
    memberSeq?: number;
    memberDisplayName?: string;
    totalPoints?: number;
    /** 베팅한 주제 라벨 */
    optionLabel?: string;
    option_label?: string;
};

/** SETTLED activity — 승리 주제 쪽 정산 지급 상위 행 */
export type EventBattleWinnerPayoutRow = {
    rank?: number;
    memberDisplayName?: string;
    stakePoints?: number;
    payoutPoints?: number;
};

/** 랭킹 행의 베팅 주제명 (JSON 키 camel/snake 호환) */
export function eventBattleRankTopicLabel(r: EventBattleBettorRank): string | undefined {
    const raw = r.optionLabel ?? r.option_label;
    const s = raw?.trim();
    return s ? s : undefined;
}

export type EventBattleActivity = {
    eventBattleSeq?: number;
    /** OPEN | SETTLED | CANCELLED — 폴링 종료 판단에 사용 */
    status?: string;
    options?: EventBattleOption[];
    totalPool?: number;
    /** 베팅 실행 횟수(행 수) */
    betCount?: number;
    /** 서로 다른 참여 회원 수 */
    participantCount?: number;
    lastBetSeq?: number;
    recentBets?: EventBattleBetRow[];
    myBet?: EventBattleMyBet | null;
    /** 로그인 사용자 본인 베팅(행 단위 금액, 최신순) */
    myBetHistory?: EventBattleBetRow[];
    myVoteOptionSeqs?: number[];
    /** 이벤트 내 총 베팅액 상위 */
    bettorRanking?: EventBattleBettorRank[];
    /** 종료 후 — 승리 주제 베팅자 중 정산 지급 상위 5 */
    winnerPayoutTop5?: EventBattleWinnerPayoutRow[];
    winnerPayoutOtherMemberCount?: number;
    winnerPayoutOtherTotal?: number;
};

type ApiEnvelope<T> = { success: boolean; message?: string; data?: T };

export async function searchEventBattles(params: {
    page?: number;
    size?: number;
    status?: string;
}): Promise<{ items: EventBattleListItem[]; totalCount: number }> {
    const res = await fetch("/api/event-battles/search", {
        ...defaultApiRequestInit,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            page: params.page ?? 1,
            size: params.size ?? 20,
            status: params.status ?? "",
        }),
    });
    const json = (await res.json()) as ApiEnvelope<{
        items?: EventBattleListItem[];
        totalCount?: number;
    }>;
    if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "목록 조회 실패");
    }
    return {
        items: json.data.items ?? [],
        totalCount: json.data.totalCount ?? 0,
    };
}

export async function getEventBattle(eventBattleSeq: number): Promise<EventBattleListItem> {
    const res = await fetch(`/api/event-battles/${eventBattleSeq}`, {
        ...defaultApiRequestInit,
        method: "GET",
    });
    const json = (await res.json()) as ApiEnvelope<EventBattleListItem>;
    if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "상세 조회 실패");
    }
    return json.data;
}

export async function getEventBattleActivity(
    eventBattleSeq: number,
    opts?: { sinceBetSeq?: number; recentLimit?: number }
): Promise<EventBattleActivity> {
    const sp = new URLSearchParams();
    if (opts?.sinceBetSeq != null) sp.set("sinceBetSeq", String(opts.sinceBetSeq));
    if (opts?.recentLimit != null) sp.set("recentLimit", String(opts.recentLimit));
    const qs = sp.toString();
    const res = await fetch(`/api/event-battles/${eventBattleSeq}/activity${qs ? `?${qs}` : ""}`, {
        ...defaultApiRequestInit,
        method: "GET",
    });
    const json = (await res.json()) as ApiEnvelope<EventBattleActivity>;
    if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "활동 조회 실패");
    }
    return json.data;
}

/** 최근 베팅 한 페이지(초기 폴링·더보기 동일) */
export const EVENT_BATTLE_RECENT_BETS_PAGE = 20;

/**
 * 상세 화면에서 스크롤로 누적 표시할 최대 행 수.
 * 서버는 항상 LIMIT(페이지) 단위로만 조회하므로, DB 부하는 건수와 무관하게 유지됨.
 * 이 값은 브라우저 DOM·메모리만 보호.
 */
export const EVENT_BATTLE_RECENT_MAX_DISPLAY = 200;

export async function getEventBattleRecentBetsOlder(
    eventBattleSeq: number,
    beforeBetSeq: number,
    limit: number = EVENT_BATTLE_RECENT_BETS_PAGE
): Promise<EventBattleBetRow[]> {
    const sp = new URLSearchParams();
    sp.set("beforeBetSeq", String(beforeBetSeq));
    sp.set("limit", String(limit));
    const res = await fetch(`/api/event-battles/${eventBattleSeq}/recent-bets?${sp.toString()}`, {
        ...defaultApiRequestInit,
        method: "GET",
    });
    const json = (await res.json()) as ApiEnvelope<EventBattleBetRow[]>;
    if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "추가 베팅 목록 조회 실패");
    }
    return json.data;
}

export async function createEventBattle(body: {
    title: string;
    optionLabels: string[];
    voteLimitPerMember?: number;
    /** true면 투표 전용(베팅 불가) */
    voteOnly?: boolean;
}): Promise<EventBattleListItem> {
    const res = await fetch("/api/event-battles", {
        ...defaultApiRequestInit,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const json = (await res.json()) as ApiEnvelope<EventBattleListItem>;
    if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message ?? "등록 실패");
    }
    return json.data;
}

export async function placeBet(
    eventBattleSeq: number,
    eventBattleOptionSeq: number,
    points: number
): Promise<void> {
    const res = await fetch(`/api/event-battles/${eventBattleSeq}/bets`, {
        ...defaultApiRequestInit,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventBattleOptionSeq, points }),
    });
    const json = (await res.json()) as ApiEnvelope<unknown>;
    if (!res.ok || !json.success) {
        throw new Error(json.message ?? "베팅 실패");
    }
}

export async function voteEventBattle(eventBattleSeq: number, optionSeqs: number[]): Promise<void> {
    const res = await fetch(`/api/event-battles/${eventBattleSeq}/votes`, {
        ...defaultApiRequestInit,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionSeqs }),
    });
    const json = (await res.json()) as ApiEnvelope<unknown>;
    if (!res.ok || !json.success) {
        throw new Error(json.message ?? "투표 실패");
    }
}

export async function settleEventBattle(eventBattleSeq: number, winnerOptionSeq: number): Promise<void> {
    const res = await fetch(`/api/event-battles/${eventBattleSeq}/settle`, {
        ...defaultApiRequestInit,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerOptionSeq }),
    });
    const json = (await res.json()) as ApiEnvelope<unknown>;
    if (!res.ok || !json.success) {
        throw new Error(json.message ?? "정산 실패");
    }
}

/** 투표 전용 이벤트: 투표 마감(종료). 이후 투표 API 불가 */
export async function closeVoteOnlyEventBattle(eventBattleSeq: number): Promise<void> {
    const res = await fetch(`/api/event-battles/${eventBattleSeq}/close-voting`, {
        ...defaultApiRequestInit,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({}),
    });
    const json = (await res.json()) as ApiEnvelope<unknown>;
    if (!res.ok || !json.success) {
        throw new Error(json.message ?? "투표 마감 실패");
    }
}

export async function cancelEventBattle(eventBattleSeq: number): Promise<void> {
    const res = await fetch(`/api/event-battles/${eventBattleSeq}/cancel`, {
        ...defaultApiRequestInit,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({}),
    });
    const json = (await res.json()) as ApiEnvelope<unknown>;
    if (!res.ok || !json.success) {
        throw new Error(json.message ?? "이벤트 취소 실패");
    }
}
