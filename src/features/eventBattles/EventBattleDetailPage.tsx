"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { bumpWalletRefresh, useWalletRefreshStore } from "@/stores/walletRefreshStore";
import { fetchMyWallet } from "@/features/members/walletApi";
import {
    EVENT_BATTLE_RECENT_BETS_PAGE,
    EVENT_BATTLE_RECENT_MAX_DISPLAY,
    eventBattleRankTopicLabel,
    getEventBattle,
    getEventBattleActivity,
    getEventBattleRecentBetsOlder,
    placeBet,
    voteEventBattle,
    closeVoteOnlyEventBattle,
    cancelEventBattle,
    settleEventBattle,
    type EventBattleActivity,
    type EventBattleBetRow,
    type EventBattleBettorRank,
    type EventBattleListItem,
    type EventBattleOption,
    type EventBattleWinnerPayoutRow,
} from "./api";
import EventBattleResultCelebrationModal from "./EventBattleResultCelebrationModal";
import VoteBattleResultCelebrationModal from "./VoteBattleResultCelebrationModal";
import { EventBattleStatusBadge } from "./EventBattleStatusBadge";
import styles from "./EventBattleDetailPage.module.css";

const BET_STEP = 100;
const BET_DEFAULT = 1000;
const BET_MIN = 100;

/** 투표 전용: 주제 카드·투표 현황 목록 공통 정렬 */
type VoteListSortMode = "votes" | "topic";

/** SSE `activity` 이벤트는 서버가 모든 클라이언트에 동일 payload를 보내므로 내 베팅 필드는 이전 값을 유지 */
function mergeActivityFromBroadcast(
    incoming: EventBattleActivity,
    prev: EventBattleActivity | null
): EventBattleActivity {
    return {
        ...incoming,
        myBet: prev?.myBet ?? incoming.myBet ?? null,
        myVoteOptionSeqs: prev?.myVoteOptionSeqs ?? incoming.myVoteOptionSeqs ?? [],
        myBetHistory:
            prev?.myBetHistory != null && prev.myBetHistory.length > 0
                ? prev.myBetHistory
                : (incoming.myBetHistory ?? []),
    };
}

function clampBetAmount(n: number, max: number | null): number {
    let v = Math.round(n / BET_STEP) * BET_STEP;
    if (v < BET_MIN) v = BET_MIN;
    if (max != null) {
        if (max < BET_MIN) return BET_MIN;
        if (v > max) v = Math.floor(max / BET_STEP) * BET_STEP;
        if (v < BET_MIN) v = BET_MIN;
    }
    return v;
}

type Props = { eventBattleSeq: number };

function formatPoolSharePercent(topicPts: number, totalPool: number): string {
    if (totalPool <= 0 || topicPts <= 0) return "0%";
    const pct = (topicPts / totalPool) * 100;
    if (pct >= 10) return `${Math.round(pct)}%`;
    const rounded = Math.round(pct * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg - 90) * (Math.PI / 180);
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

function buildSectorPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const start = polarToCartesian(cx, cy, r, endDeg);
    const end = polarToCartesian(cx, cy, r, startDeg);
    const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function truncateWheelLabel(label: string | undefined, max = 12): string {
    const s = (label ?? "").trim();
    if (s.length <= max) return s;
    return `${s.slice(0, max)}…`;
}

function normalizeDeg(v: number): number {
    const n = v % 360;
    return n < 0 ? n + 360 : n;
}

function OptionBetCard({
    opt,
    disabled,
    lockedOther,
    busy,
    pointBalance,
    totalPool,
    highlightLeadingShare,
    highlightWinner,
    showVoteCount,
    onBet,
}: {
    opt: EventBattleOption;
    disabled: boolean;
    lockedOther: boolean;
    busy: boolean;
    pointBalance: number | null;
    /** 이벤트 전체 베팅 풀(주제 비중 계산용) */
    totalPool: number;
    /** OPEN일 때만: 풀 대비 비중(포인트) 1위 */
    highlightLeadingShare: boolean;
    /** SETTLED: 확정 승리 주제 */
    highlightWinner: boolean;
    /** 베팅 이벤트에서는 false — 투표 수 표시로 혼동 방지 */
    showVoteCount: boolean;
    onBet: (optionSeq: number, points: number) => void;
}) {
    const optSeq = opt.eventBattleOptionSeq ?? 0;
    const maxPts = pointBalance;
    const [localPts, setLocalPts] = useState(BET_DEFAULT);

    useEffect(() => {
        setLocalPts((prev) => {
            if (maxPts == null || maxPts < BET_MIN) return prev;
            const cap = clampBetAmount(BET_DEFAULT, maxPts);
            if (prev > maxPts) return cap;
            return prev;
        });
    }, [maxPts]);

    const total = opt.pointsTotal ?? 0;
    const voteCount = opt.voteCount ?? 0;
    const poolTotal = totalPool > 0 ? totalPool : 0;
    const sharePct = poolTotal > 0 ? Math.min(100, (total / poolTotal) * 100) : 0;
    const canBetAmount = maxPts != null && maxPts >= BET_MIN && localPts >= BET_MIN && localPts <= maxPts;
    const cardDisabled = disabled || lockedOther || busy || optSeq < 1;

    const cardOuterClass = highlightLeadingShare
        ? `${styles.card} ${styles.cardTopShare}`
        : highlightWinner
          ? `${styles.card} ${styles.cardWinner}`
          : styles.card;
    const cardInnerClass = highlightLeadingShare
        ? `${styles.cardInner} ${styles.cardInnerTopShare}`
        : highlightWinner
          ? `${styles.cardInner} ${styles.cardInnerWinner}`
          : styles.cardInner;
    const pctClass = highlightLeadingShare
        ? `${styles.poolSharePct} ${styles.poolSharePctTop}`
        : highlightWinner
          ? `${styles.poolSharePct} ${styles.poolSharePctWinner}`
          : styles.poolSharePct;

    return (
        <div className={cardOuterClass}>
            <div className={cardInnerClass}>
                <div className={styles.badge}>주제 {opt.sortOrder}</div>
                <h3 className={styles.label}>{opt.label}</h3>
                <div className={styles.poolTotal}>{total.toLocaleString()} P</div>
                <p className={styles.poolHint}>이 주제에 걸린 포인트 합계</p>
                {showVoteCount ? (
                    <p className="mb-2 text-xs text-violet-300">투표 {voteCount.toLocaleString()} 표</p>
                ) : null}
                <div className={styles.poolShare}>
                    <div className={styles.poolShareMeta}>
                        <span>
                            <strong>{total.toLocaleString()}</strong> / {poolTotal.toLocaleString()} P
                        </span>
                        <span className={pctClass}>{formatPoolSharePercent(total, poolTotal)}</span>
                    </div>
                    <div
                        className={styles.poolShareTrack}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(sharePct)}
                        aria-label="이 주제 베팅 비중"
                    >
                        <div className={styles.poolShareFill} style={{ width: `${sharePct}%` }} />
                    </div>
                </div>
                {lockedOther ? (
                    <p className="mb-2 text-xs text-amber-200/90">다른 주제에 베팅 중이면 여기는 베팅할 수 없습니다.</p>
                ) : null}
                <div className={styles.betRow}>
                    <input
                        type="number"
                        min={BET_MIN}
                        max={maxPts != null && maxPts >= BET_MIN ? maxPts : undefined}
                        step={BET_STEP}
                        className={styles.pointsInput}
                        value={localPts}
                        disabled={cardDisabled}
                        onChange={(e) => setLocalPts(Number(e.target.value))}
                        onBlur={() => setLocalPts((p) => clampBetAmount(p, maxPts))}
                    />
                    <span className={styles.pointsUnit}>P</span>
                </div>
                {maxPts != null ? (
                    <p className="mb-2 text-xs text-slate-500">보유 {maxPts.toLocaleString()} P 이내</p>
                ) : null}
                <button
                    type="button"
                    disabled={cardDisabled || !canBetAmount}
                    className={styles.betBtn}
                    onClick={() => onBet(optSeq, clampBetAmount(localPts, maxPts))}
                >
                    베팅
                </button>
            </div>
        </div>
    );
}

export default function EventBattleDetailPage({ eventBattleSeq }: Props) {
    const user = useAuthStore((s) => s.user);
    const walletTick = useWalletRefreshStore((s) => s.tick);
    const [detail, setDetail] = useState<EventBattleListItem | null>(null);
    const [activity, setActivity] = useState<EventBattleActivity | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [pointBalance, setPointBalance] = useState<number | null>(null);
    /** activity.recentBets 이후 페이지(더 오래된 베팅) */
    const [olderRecentBets, setOlderRecentBets] = useState<EventBattleBetRow[]>([]);
    const [loadingOlderRecent, setLoadingOlderRecent] = useState(false);
    const loadingOlderRef = useRef(false);
    const loadOlderRecentRef = useRef<() => Promise<void>>(async () => {});
    const recentSentinelRef = useRef<HTMLLIElement | null>(null);
    const recentListScrollRef = useRef<HTMLUListElement | null>(null);

    /** OPEN → SETTLED 전환 시에만 축하 모달 (이미 종료된 글 방문 시에는 미표시) */
    const battleStatusInitRef = useRef(true);
    const prevEffectiveStatusRef = useRef<string | undefined>(undefined);
    const [celebratePending, setCelebratePending] = useState(false);
    const [celebrationOpen, setCelebrationOpen] = useState(false);
    const [celebrationWinner, setCelebrationWinner] = useState("");
    const [celebrationTotalPool, setCelebrationTotalPool] = useState(0);
    const [celebrationWinnerPayoutTop5, setCelebrationWinnerPayoutTop5] = useState<EventBattleWinnerPayoutRow[]>([]);
    const [celebrationWinnerOtherCount, setCelebrationWinnerOtherCount] = useState(0);
    const [celebrationWinnerOtherTotal, setCelebrationWinnerOtherTotal] = useState(0);
    const [rouletteOpen, setRouletteOpen] = useState(false);
    const [rouletteSpinning, setRouletteSpinning] = useState(false);
    const [rouletteIndex, setRouletteIndex] = useState(0);
    const [rouletteRotation, setRouletteRotation] = useState(0);
    const [rouletteWinnerSeq, setRouletteWinnerSeq] = useState<number | null>(null);
    const [voteSelections, setVoteSelections] = useState<number[]>([]);
    /** 투표 현황: 주제별 막대(비율) 표시 여부 — 득표 수 숫자는 표시하지 않음 */
    const [voteStatusDetailBySeq, setVoteStatusDetailBySeq] = useState<Record<number, boolean>>({});
    const [voteListSort, setVoteListSort] = useState<VoteListSortMode>("topic");
    const [voteResultCelebrationOpen, setVoteResultCelebrationOpen] = useState(false);

    useEffect(() => {
        setOlderRecentBets([]);
        battleStatusInitRef.current = true;
        prevEffectiveStatusRef.current = undefined;
        setCelebratePending(false);
        setCelebrationOpen(false);
        setCelebrationWinner("");
        setCelebrationTotalPool(0);
        setCelebrationWinnerPayoutTop5([]);
        setCelebrationWinnerOtherCount(0);
        setCelebrationWinnerOtherTotal(0);
        setVoteStatusDetailBySeq({});
        setVoteListSort("topic");
        setVoteResultCelebrationOpen(false);
    }, [eventBattleSeq]);

    const loadDetail = useCallback(async () => {
        try {
            const d = await getEventBattle(eventBattleSeq);
            setDetail(d);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "상세 조회 실패");
        }
    }, [eventBattleSeq]);

    useEffect(() => {
        void loadDetail();
    }, [loadDetail]);

    useEffect(() => {
        if (!user?.memberSeq) {
            setPointBalance(null);
            // SSE 공용 스냅샷 때문에 myBet이 남아있을 수 있어, 로그아웃 시 잠금 해제 상태로 맞춤
            setActivity((prev) =>
                prev
                    ? {
                          ...prev,
                          myBet: null,
                          myVoteOptionSeqs: [],
                          myBetHistory: [],
                      }
                    : prev
            );
            return;
        }
        void fetchMyWallet()
            .then((w) => setPointBalance(w.pointBalance ?? 0))
            .catch(() => setPointBalance(null));
    }, [user?.memberSeq, walletTick]);

    // 로그아웃/재로그인 시 SSE 공용 스냅샷에는 myBet/myBetHistory가 없으므로,
    // 현재 로그인 사용자 기준으로 1회 activity를 다시 가져와 버튼 잠금 로직이 정상 동작하게 함.
    useEffect(() => {
        if (!user?.memberSeq) return;
        let cancelled = false;
        (async () => {
            try {
                const fresh = await getEventBattleActivity(eventBattleSeq, {
                    recentLimit: EVENT_BATTLE_RECENT_BETS_PAGE,
                });
                if (cancelled) return;
                setActivity(fresh);
                setErr(null);
            } catch (e) {
                if (cancelled) return;
                setErr(e instanceof Error ? e.message : "활동 재조회 실패");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [eventBattleSeq, user?.memberSeq]);

    useEffect(() => {
        const mine = activity?.myVoteOptionSeqs ?? [];
        setVoteSelections(mine.filter((v): v is number => typeof v === "number"));
    }, [activity?.myVoteOptionSeqs, eventBattleSeq]);

    /** 폴링·UI 공통: activity가 더 자주 갱신되므로 우선 */
    const effectiveStatus = activity?.status ?? detail?.status;
    const isEventOpen = effectiveStatus === "OPEN";

    // SSE: 베팅/정산/취소 시에만 푸시. `activity` 이벤트는 공용 스냅샷이라 내 베팅은 병합 유지.
    useEffect(() => {
        let es: EventSource | null = null;
        let closed = false;

        const finishIfClosed = (a: EventBattleActivity) => {
            if (a?.status && a.status !== "OPEN") {
                es?.close();
                closed = true;
            }
        };

        const handleInit = (data: string) => {
            try {
                const a = JSON.parse(data) as EventBattleActivity;
                if (closed) return;
                setActivity(a);
                setErr(null);
                finishIfClosed(a);
            } catch {
                /* ignore */
            }
        };

        const handleActivity = (data: string) => {
            try {
                const a = JSON.parse(data) as EventBattleActivity;
                if (closed) return;
                setActivity((prev) => mergeActivityFromBroadcast(a, prev));
                setErr(null);
                finishIfClosed(a);
            } catch {
                /* ignore */
            }
        };

        try {
            es = new EventSource(`/api/event-battles/${eventBattleSeq}/activity/stream`);
            es.addEventListener("init", (ev) => handleInit(ev.data));
            es.addEventListener("activity", (ev) => handleActivity(ev.data));
            es.addEventListener("ping", () => {
                /* noop */
            });
        } catch (e) {
            setErr(e instanceof Error ? e.message : "SSE 연결 실패");
        }

        return () => {
            closed = true;
            es?.close();
        };
    }, [eventBattleSeq]);

    /** activity가 먼저 종료로 바뀌면 상세(정산일·승리 주제) 즉시 맞춤 */
    useEffect(() => {
        const a = activity?.status;
        const d = detail?.status;
        if (a != null && a !== "OPEN" && d === "OPEN") {
            void loadDetail();
        }
    }, [activity?.status, detail?.status, loadDetail]);

    useEffect(() => {
        if (effectiveStatus == null) return;
        if (battleStatusInitRef.current) {
            battleStatusInitRef.current = false;
            prevEffectiveStatusRef.current = effectiveStatus;
            return;
        }
        const prev = prevEffectiveStatusRef.current;
        prevEffectiveStatusRef.current = effectiveStatus;
        if (prev === "OPEN" && effectiveStatus === "SETTLED") {
            /** 투표 전용·승리 주제 미지정(투표 종료만) → 베팅용 폭죽 자동 표시 안 함 */
            const voteOnlyClosed =
                detail?.voteOnlyYn === "Y" &&
                (detail?.winnerOptionSeq == null || detail?.winnerOptionSeq === undefined);
            if (voteOnlyClosed) {
                return;
            }
            setCelebratePending(true);
        }
    }, [effectiveStatus, detail?.voteOnlyYn, detail?.winnerOptionSeq]);

    const mergedOptions: EventBattleOption[] = useMemo(
        () => (activity?.options?.length ? activity.options : (detail?.options ?? [])),
        [activity?.options, detail?.options]
    );

    useEffect(() => {
        if (!celebratePending) return;
        if (effectiveStatus !== "SETTLED") {
            setCelebratePending(false);
            return;
        }
        if (detail?.voteOnlyYn === "Y" && (detail?.winnerOptionSeq == null || detail?.winnerOptionSeq === undefined)) {
            setCelebratePending(false);
            return;
        }
        const label =
            detail?.winnerLabel?.trim() ||
            mergedOptions.find((o) => o.eventBattleOptionSeq === detail?.winnerOptionSeq)?.label?.trim() ||
            "";
        const snapStats = () => {
            setCelebrationTotalPool(activity?.totalPool ?? 0);
            setCelebrationWinnerPayoutTop5(activity?.winnerPayoutTop5 ?? []);
            setCelebrationWinnerOtherCount(activity?.winnerPayoutOtherMemberCount ?? 0);
            setCelebrationWinnerOtherTotal(activity?.winnerPayoutOtherTotal ?? 0);
        };
        if (label) {
            setCelebrationWinner(label);
            snapStats();
            setCelebrationOpen(true);
            setCelebratePending(false);
            return;
        }
        const t = window.setTimeout(() => {
            const fallback =
                detail?.winnerLabel?.trim() ||
                mergedOptions.find((o) => o.eventBattleOptionSeq === detail?.winnerOptionSeq)?.label?.trim() ||
                "결과가 확정되었습니다";
            setCelebrationWinner(fallback);
            snapStats();
            setCelebrationOpen(true);
            setCelebratePending(false);
        }, 2200);
        return () => window.clearTimeout(t);
    }, [
        celebratePending,
        effectiveStatus,
        detail?.winnerLabel,
        detail?.winnerOptionSeq,
        mergedOptions,
        activity?.totalPool,
        activity?.winnerPayoutTop5,
        activity?.winnerPayoutOtherMemberCount,
        activity?.winnerPayoutOtherTotal,
        detail?.voteOnlyYn,
        detail?.winnerOptionSeq,
    ]);

    const onBet = async (optionSeq: number, points: number) => {
        if (!user?.memberSeq) {
            alert("로그인 후 베팅할 수 있습니다.");
            return;
        }
        if (points < BET_MIN) {
            alert(`${BET_MIN}P 이상 입력해 주세요.`);
            return;
        }
        if (pointBalance != null && points > pointBalance) {
            alert("보유 포인트보다 많이 베팅할 수 없습니다.");
            return;
        }
        try {
            setBusy(true);
            await placeBet(eventBattleSeq, optionSeq, points);
            bumpWalletRefresh();
            const fresh = await getEventBattleActivity(eventBattleSeq, {
                recentLimit: EVENT_BATTLE_RECENT_BETS_PAGE,
            });
            setActivity(fresh);
        } catch (e) {
            alert(e instanceof Error ? e.message : "베팅 실패");
        } finally {
            setBusy(false);
        }
    };

    const onSettle = async (winnerOptionSeq: number, skipConfirm = false) => {
        const label = activity?.options?.find((o) => o.eventBattleOptionSeq === winnerOptionSeq)?.label ?? "?";
        if (!skipConfirm && !confirm(`승리 주제: 「${label}」 — 정산할까요?`)) return;
        try {
            setBusy(true);
            await settleEventBattle(eventBattleSeq, winnerOptionSeq);
            bumpWalletRefresh();
            await loadDetail();
            const fresh = await getEventBattleActivity(eventBattleSeq, {
                recentLimit: EVENT_BATTLE_RECENT_BETS_PAGE,
            });
            setActivity(fresh);
        } catch (e) {
            alert(e instanceof Error ? e.message : "정산 실패");
        } finally {
            setBusy(false);
        }
    };

    const onOpenRoulette = () => {
        if (!open) return;
        if (options.length < 2) {
            alert("룰렛은 주제 2개 이상일 때 사용할 수 있습니다.");
            return;
        }
        setRouletteIndex(0);
        setRouletteRotation(0);
        setRouletteWinnerSeq(null);
        setRouletteOpen(true);
    };

    const onStartRoulette = async () => {
        if (rouletteSpinning || busy) return;
        if (options.length < 2) return;
        setRouletteSpinning(true);
        const chosen = Math.floor(Math.random() * options.length);
        const slice = 360 / options.length;
        const target = chosen * slice + slice / 2;
        const spins = 5;
        const finalRotation = rouletteRotation + spins * 360 + (360 - target);
        setRouletteWinnerSeq(null);
        setRouletteRotation(finalRotation);
        window.setTimeout(() => {
            setRouletteSpinning(false);
            // 보이는 최종 각도(상단 포인터 기준)로 당첨 칸을 다시 계산해 확정값과 UI를 일치시킴
            const norm = normalizeDeg(finalRotation);
            const pointerAngle = 0; // 상단 포인터
            let bestIdx = 0;
            let bestDiff = Number.POSITIVE_INFINITY;
            for (let idx = 0; idx < options.length; idx++) {
                const center = normalizeDeg(idx * slice + slice / 2 + norm);
                let diff = Math.abs(center - pointerAngle);
                if (diff > 180) diff = 360 - diff;
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestIdx = idx;
                }
            }
            setRouletteIndex(bestIdx);
            setRouletteWinnerSeq(options[bestIdx].eventBattleOptionSeq ?? null);
        }, 4200);
    };

    const onConfirmRouletteWinner = async () => {
        if (rouletteWinnerSeq == null) return;
        await onSettle(rouletteWinnerSeq, true);
        setRouletteOpen(false);
    };

    const onCancelEvent = async () => {
        const isVoteOnlyEvent = detail?.voteOnlyYn === "Y";
        const msg = isVoteOnlyEvent ? "이벤트를 취소할까요?" : "이벤트를 취소하고 참가자 포인트를 모두 환불할까요?";
        if (!confirm(msg)) return;
        try {
            setBusy(true);
            await cancelEventBattle(eventBattleSeq);
            bumpWalletRefresh();
            await loadDetail();
            const fresh = await getEventBattleActivity(eventBattleSeq, {
                recentLimit: EVENT_BATTLE_RECENT_BETS_PAGE,
            });
            setActivity(fresh);
        } catch (e) {
            alert(e instanceof Error ? e.message : "취소 실패");
        } finally {
            setBusy(false);
        }
    };

    const onCloseVoteOnly = async () => {
        if (!confirm("투표를 마감할까요? 마감 후에는 더 이상 투표할 수 없습니다.")) return;
        try {
            setBusy(true);
            await closeVoteOnlyEventBattle(eventBattleSeq);
            await loadDetail();
            const fresh = await getEventBattleActivity(eventBattleSeq, {
                recentLimit: EVENT_BATTLE_RECENT_BETS_PAGE,
            });
            setActivity(fresh);
        } catch (e) {
            alert(e instanceof Error ? e.message : "투표 마감 실패");
        } finally {
            setBusy(false);
        }
    };

    /** 투표권 1개: 라디오처럼 다른 주제를 누르면 즉시 교체됨. 2개 이상: 체크 토글. */
    const onVoteOptionClick = (optionSeq: number, limit: number) => {
        if (optionSeq < 1) return;
        setVoteSelections((prev) => {
            if (limit === 1) {
                return [optionSeq];
            }
            const exists = prev.includes(optionSeq);
            if (exists) return prev.filter((v) => v !== optionSeq);
            if (prev.length >= limit) return prev;
            return [...prev, optionSeq];
        });
    };

    const onSubmitVotes = async () => {
        const limit = detail?.voteLimitPerMember && detail.voteLimitPerMember > 0 ? detail.voteLimitPerMember : 1;
        if (!user?.memberSeq) {
            alert("로그인 후 투표할 수 있습니다.");
            return;
        }
        if (!open) {
            alert("종료된 이벤트는 투표할 수 없습니다.");
            return;
        }
        if (voteSelections.length < 1) {
            alert("최소 1개 주제를 선택해 주세요.");
            return;
        }
        if (voteSelections.length > limit) {
            alert(`투표권은 최대 ${limit}개입니다.`);
            return;
        }
        try {
            setBusy(true);
            await voteEventBattle(eventBattleSeq, voteSelections);
            const fresh = await getEventBattleActivity(eventBattleSeq, {
                recentLimit: EVENT_BATTLE_RECENT_BETS_PAGE,
            });
            setActivity(fresh);
            alert("투표가 반영되었습니다.");
        } catch (e) {
            alert(e instanceof Error ? e.message : "투표 실패");
        } finally {
            setBusy(false);
        }
    };

    const isCreator = user?.memberSeq != null && detail?.creatorMemberSeq === user.memberSeq;
    const open = isEventOpen;
    const myBet = activity?.myBet;
    const myBetHistory = activity?.myBetHistory ?? [];

    const allRecentBets = useMemo(
        () => [...(activity?.recentBets ?? []), ...olderRecentBets],
        [activity?.recentBets, olderRecentBets]
    );
    const totalBetRows = activity?.betCount ?? 0;
    const atRecentDisplayCap = allRecentBets.length >= EVENT_BATTLE_RECENT_MAX_DISPLAY;
    const canLoadMoreRecent = totalBetRows > allRecentBets.length && !atRecentDisplayCap;

    const loadOlderRecent = useCallback(async () => {
        if (loadingOlderRef.current) return;
        const recent = activity?.recentBets ?? [];
        const combined = [...recent, ...olderRecentBets];
        if (combined.length === 0) return;
        if (combined.length >= EVENT_BATTLE_RECENT_MAX_DISPLAY) return;
        if ((activity?.betCount ?? 0) <= combined.length) return;
        const seqs = combined.map((b) => b.eventBattleBetSeq).filter((s): s is number => s != null && s > 0);
        if (seqs.length === 0) return;
        const beforeBetSeq = Math.min(...seqs);

        loadingOlderRef.current = true;
        setLoadingOlderRecent(true);
        try {
            const chunk = await getEventBattleRecentBetsOlder(
                eventBattleSeq,
                beforeBetSeq,
                EVENT_BATTLE_RECENT_BETS_PAGE
            );
            if (chunk.length === 0) return;
            const firstLen = activity?.recentBets?.length ?? 0;
            const maxOlder = Math.max(0, EVENT_BATTLE_RECENT_MAX_DISPLAY - firstLen);
            setOlderRecentBets((prev) => [...prev, ...chunk].slice(0, maxOlder));
        } catch {
            /* ignore */
        } finally {
            loadingOlderRef.current = false;
            setLoadingOlderRecent(false);
        }
    }, [activity?.betCount, activity?.recentBets, eventBattleSeq, olderRecentBets]);

    loadOlderRecentRef.current = loadOlderRecent;

    useEffect(() => {
        const root = recentListScrollRef.current;
        const el = recentSentinelRef.current;
        if (!root || !el || !canLoadMoreRecent) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) void loadOlderRecentRef.current();
            },
            { root, rootMargin: "120px", threshold: 0 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [canLoadMoreRecent, allRecentBets.length, eventBattleSeq]);
    const hasBet = myBetHistory.length > 0 || (myBet != null && (myBet.pointAmount ?? 0) > 0);
    const myOptSeq = myBet?.eventBattleOptionSeq ?? myBetHistory[0]?.eventBattleOptionSeq;
    const options = mergedOptions;
    const totalPoolForBars = useMemo(() => {
        const raw = activity?.totalPool;
        if (typeof raw === "number" && raw > 0) return raw;
        return mergedOptions.reduce((s, o) => s + (o.pointsTotal ?? 0), 0);
    }, [activity?.totalPool, mergedOptions]);

    /** 비중 1위 = 같은 총풀 기준 포인트 최대(동률이면 해당 주제 모두 하이라이트) */
    const topPoolOptionSeqs = useMemo(() => {
        if (totalPoolForBars <= 0 || mergedOptions.length === 0) return new Set<number>();
        let maxPts = 0;
        for (const o of mergedOptions) {
            const p = o.pointsTotal ?? 0;
            if (p > maxPts) maxPts = p;
        }
        if (maxPts <= 0) return new Set<number>();
        const set = new Set<number>();
        for (const o of mergedOptions) {
            const seq = o.eventBattleOptionSeq ?? 0;
            if (seq > 0 && (o.pointsTotal ?? 0) === maxPts) set.add(seq);
        }
        return set;
    }, [mergedOptions, totalPoolForBars]);

    const voteOnly = detail?.voteOnlyYn === "Y";
    const totalVoteCount = useMemo(() => mergedOptions.reduce((s, o) => s + (o.voteCount ?? 0), 0), [mergedOptions]);

    /** 투표 전용 UI: 정렬 버튼(투표 많은 순 / 주제 번호 순)에 따라 순서 결정 */
    const voteOrderedOptions = useMemo(() => {
        const next = [...mergedOptions];
        if (voteListSort === "votes") {
            next.sort((a, b) => {
                const d = (b.voteCount ?? 0) - (a.voteCount ?? 0);
                if (d !== 0) return d;
                return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
            });
        } else {
            next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
        return next;
    }, [mergedOptions, voteListSort]);

    const showAllVoteStatusDetails = useCallback(() => {
        const next: Record<number, boolean> = {};
        for (const o of mergedOptions) {
            const s = o.eventBattleOptionSeq ?? 0;
            if (s > 0) next[s] = true;
        }
        setVoteStatusDetailBySeq(next);
    }, [mergedOptions]);

    const hideAllVoteStatusDetails = useCallback(() => {
        setVoteStatusDetailBySeq({});
    }, []);

    const toggleVoteStatusDetail = useCallback((seq: number) => {
        if (seq < 1) return;
        setVoteStatusDetailBySeq((p) => ({ ...p, [seq]: !p[seq] }));
    }, []);

    /** 투표 전용 종료 후 · 폭죽 모달용 득표 비율·승리/동점 */
    const voteShareCelebration = useMemo(() => {
        const opts = mergedOptions;
        const total = opts.reduce((s, o) => s + (o.voteCount ?? 0), 0);
        const rows = opts.map((o) => {
            const v = o.voteCount ?? 0;
            const pct = total > 0 ? (v / total) * 100 : 0;
            return {
                sortOrder: o.sortOrder ?? 0,
                label: (o.label ?? "").trim() || "—",
                votes: v,
                pct,
            };
        });
        if (rows.length === 0) {
            return {
                headlineLabels: "",
                rows: [] as { sortOrder: number; label: string; votes: number; pct: number }[],
                isTie: false,
                maxVotes: 0,
                winnerLabel: "",
                winnerVotes: 0,
                totalVotes: 0,
                tieLabels: [] as string[],
            };
        }
        const maxVotes = Math.max(...rows.map((r) => r.votes));
        const leaders = rows.filter((r) => r.votes === maxVotes);
        const isTie = leaders.length > 1;
        const headlineLabels = rows.map((r) => r.label).join(", ");
        const tieLabels = leaders.map((r) => r.label);
        const sole = !isTie && leaders[0] ? leaders[0] : null;
        return {
            headlineLabels,
            rows,
            isTie,
            maxVotes,
            winnerLabel: sole?.label ?? "",
            winnerVotes: sole?.votes ?? 0,
            totalVotes: total,
            tieLabels,
        };
    }, [mergedOptions]);

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] p-6 text-slate-100 shadow-xl">
            <div className="mb-4">
                <Link href="/event-battles" className={styles.backLink}>
                    <span className={styles.backLinkIcon}>←</span>목록
                </Link>
            </div>

            {err ? (
                <div className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                    {err}
                </div>
            ) : null}

            {!detail ? (
                <p className="text-slate-500">불러오는 중…</p>
            ) : (
                <>
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                        <h1 className="text-2xl font-bold text-white">{detail.title}</h1>
                        <EventBattleStatusBadge status={effectiveStatus} settledText="종료" showPlaceholder={false} />
                        {voteOnly ? (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-200 ring-1 ring-violet-500/35">
                                투표 전용
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                        {detail.settleDt ? (
                            <>
                                정산: <span className="text-slate-400">{detail.settleDt}</span>
                                {detail.winnerLabel ? (
                                    <>
                                        {" "}
                                        · 승리 주제: <span className="text-emerald-400">「{detail.winnerLabel}」</span>
                                    </>
                                ) : null}
                            </>
                        ) : (
                            <span>
                                {isEventOpen
                                    ? voteOnly
                                        ? "투표가 진행 중입니다."
                                        : "베팅이 진행 중입니다."
                                    : effectiveStatus === "CANCELLED"
                                      ? "이벤트가 취소되었습니다."
                                      : "이벤트가 종료되었습니다."}
                            </span>
                        )}
                    </p>

                    {!voteOnly && hasBet && user?.memberSeq ? (
                        <div className="mt-4 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
                            <div className="mb-2 font-medium text-emerald-50/95">내 베팅 내역 (최근 5건)</div>
                            {myBetHistory.length > 0 ? (
                                <ul className="max-h-52 space-y-2 overflow-y-auto">
                                    {myBetHistory.map((row) => (
                                        <li
                                            key={row.eventBattleBetSeq}
                                            className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-emerald-50/95"
                                        >
                                            「{row.optionLabel ?? "?"}」에{" "}
                                            <strong>{(row.pointAmount ?? 0).toLocaleString()}포인트</strong> 베팅
                                            {row.createDt ? (
                                                <span className="ml-2 text-xs text-emerald-600/90">{row.createDt}</span>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-emerald-200/90">
                                    「{myBet?.label}」에 참여 중입니다. (상세 행은 새로고침 후 표시됩니다.)
                                </p>
                            )}
                            <p className="mt-3 text-xs text-emerald-600/90">
                                같은 주제에만 추가 베팅할 수 있습니다 (다른 주제는 선택 불가).
                            </p>
                        </div>
                    ) : null}

                    {voteOnly ? (
                        <div className="mt-4 text-sm text-slate-400">
                            1인당 투표권 <span className="text-violet-300">{detail.voteLimitPerMember ?? 1}</span>개 ·
                            실시간 득표 수는 화면에 표시하지 않습니다.
                            <span className="ml-2 text-xs text-slate-600">
                                {effectiveStatus === "OPEN" ? "(SSE로 갱신중)" : "(종료됨)"}
                            </span>
                        </div>
                    ) : (
                        <div className="mt-4 text-sm text-slate-400">
                            총 풀:{" "}
                            <span className="text-slate-200">{(activity?.totalPool ?? 0).toLocaleString()} P</span> ·
                            참여자 <span className="text-slate-200">{activity?.participantCount ?? 0}</span>명 · 베팅{" "}
                            <span className="text-slate-200">{activity?.betCount ?? 0}</span>건
                            <span className="ml-2 text-xs text-slate-600">
                                {effectiveStatus === "OPEN" ? "(SSE로 갱신중)" : "(종료됨)"}
                            </span>
                        </div>
                    )}

                    {voteOnly ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">정렬</span>
                            <button
                                type="button"
                                onClick={() => setVoteListSort("votes")}
                                className={
                                    voteListSort === "votes"
                                        ? "rounded-lg border border-violet-500/80 bg-violet-950/55 px-3 py-1.5 text-sm font-semibold text-violet-50 ring-1 ring-violet-500/45"
                                        : "rounded-lg border border-slate-600/70 bg-slate-900/50 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/80"
                                }
                            >
                                투표 많은 순
                            </button>
                            <button
                                type="button"
                                onClick={() => setVoteListSort("topic")}
                                className={
                                    voteListSort === "topic"
                                        ? "rounded-lg border border-violet-500/80 bg-violet-950/55 px-3 py-1.5 text-sm font-semibold text-violet-50 ring-1 ring-violet-500/45"
                                        : "rounded-lg border border-slate-600/70 bg-slate-900/50 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/80"
                                }
                            >
                                주제 번호 순
                            </button>
                        </div>
                    ) : null}

                    {voteOnly ? (
                        <div className="mt-4 rounded-xl border border-violet-800/50 bg-violet-950/20 p-4">
                            <div className="mb-2 text-sm font-medium text-violet-100">주제 투표</div>
                            <p className="mb-3 text-xs text-violet-300/90">
                                이벤트당 최대 {detail.voteLimitPerMember ?? 1}개 선택 가능 · 포인트 베팅은 이 화면에서
                                할 수 없습니다.
                                {(detail.voteLimitPerMember ?? 1) === 1 ? (
                                    <span className="ml-1 text-violet-200/95">
                                        {" "}
                                        · 투표권 1개일 때는 카드를 누르면 바로 주제가 바뀝니다.
                                    </span>
                                ) : null}
                            </p>
                            <div
                                className={styles.voteGrid}
                                role={(detail.voteLimitPerMember ?? 1) === 1 ? "radiogroup" : undefined}
                                aria-label="주제 투표"
                            >
                                {voteOrderedOptions.map((opt) => {
                                    const seq = opt.eventBattleOptionSeq ?? 0;
                                    const checked = seq > 0 && voteSelections.includes(seq);
                                    const voteLimit = detail.voteLimitPerMember ?? 1;
                                    const disabled =
                                        !open ||
                                        busy ||
                                        seq < 1 ||
                                        (voteLimit > 1 && !checked && voteSelections.length >= voteLimit);
                                    return (
                                        <div
                                            key={`vote-${seq}`}
                                            className={`${styles.voteCardShell} ${checked ? styles.voteCardShellActive : ""}`}
                                        >
                                            <button
                                                type="button"
                                                role={voteLimit === 1 ? "radio" : "checkbox"}
                                                aria-checked={checked}
                                                disabled={disabled}
                                                onClick={() => onVoteOptionClick(seq, voteLimit)}
                                                className={styles.voteCardInner}
                                            >
                                                <div className={styles.voteCardBadge}>주제 {opt.sortOrder ?? "—"}</div>
                                                <div className={styles.voteCardLabel}>{opt.label}</div>
                                                <div className={styles.votePickRow}>
                                                    <span className={styles.votePickHint}>
                                                        {voteLimit === 1
                                                            ? checked
                                                                ? "선택됨"
                                                                : "탭해 선택"
                                                            : checked
                                                              ? "선택됨"
                                                              : "탭해 추가"}
                                                    </span>
                                                    {voteLimit === 1 ? (
                                                        <span
                                                            className={`${styles.voteRadio} ${checked ? styles.voteRadioOn : ""}`}
                                                            aria-hidden
                                                        >
                                                            {checked ? <span className={styles.voteRadioDot} /> : null}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`${styles.voteCheckbox} ${checked ? styles.voteCheckboxOn : ""}`}
                                                            aria-hidden
                                                        >
                                                            {checked ? (
                                                                <span className={styles.voteCheckboxCheck}>✓</span>
                                                            ) : null}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <p className="text-xs text-violet-200">
                                    선택: {voteSelections.length} / {detail.voteLimitPerMember ?? 1}
                                </p>
                                <button
                                    type="button"
                                    disabled={!open || busy}
                                    onClick={() => void onSubmitVotes()}
                                    className="rounded bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    투표 반영
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {options.map((opt) => {
                                const seq = opt.eventBattleOptionSeq ?? 0;
                                const lockedOther = Boolean(hasBet && myOptSeq != null && myOptSeq !== seq);
                                const winnerSeq = detail?.winnerOptionSeq;
                                const highlightLeadingShare = isEventOpen && seq > 0 && topPoolOptionSeqs.has(seq);
                                const highlightWinner =
                                    !isEventOpen &&
                                    effectiveStatus === "SETTLED" &&
                                    winnerSeq != null &&
                                    seq > 0 &&
                                    seq === winnerSeq;
                                return (
                                    <OptionBetCard
                                        key={opt.eventBattleOptionSeq ?? opt.sortOrder}
                                        opt={opt}
                                        disabled={!open}
                                        lockedOther={lockedOther}
                                        busy={busy}
                                        pointBalance={pointBalance}
                                        totalPool={totalPoolForBars}
                                        highlightLeadingShare={highlightLeadingShare}
                                        highlightWinner={highlightWinner}
                                        showVoteCount={false}
                                        onBet={onBet}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {open && isCreator && voteOnly ? (
                        <div className="mt-8 rounded-xl border border-violet-700/50 bg-violet-950/20 p-4">
                            <div className="mb-2 text-sm font-medium text-violet-100">투표 이벤트 (작성자)</div>
                            <p className="mb-3 text-xs text-violet-300/90">
                                투표 종료 후에는 참가자가 더 이상 투표하거나 변경할 수 없습니다.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void onCloseVoteOnly()}
                                    className="rounded-lg border border-violet-500/90 bg-violet-600/30 px-4 py-2 text-sm font-semibold text-violet-50 hover:bg-violet-600/45 disabled:opacity-50"
                                >
                                    투표 종료
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={onCancelEvent}
                                    className="rounded-lg border border-rose-700/80 bg-rose-950/40 px-4 py-2 text-sm text-rose-100 hover:bg-rose-900/40 disabled:opacity-50"
                                >
                                    이벤트 취소
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {open && isCreator && !voteOnly ? (
                        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                            <div className="mb-2 text-sm font-medium text-slate-300">승리 주제 확정 (작성자)</div>
                            <div className="mb-3">
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={onOpenRoulette}
                                    className="rounded-lg border border-violet-600/80 bg-violet-950/40 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-900/40 disabled:opacity-50"
                                >
                                    룰렛으로 승리 뽑기
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {options.map((opt) => (
                                    <button
                                        key={opt.eventBattleOptionSeq}
                                        type="button"
                                        disabled={busy}
                                        onClick={() => opt.eventBattleOptionSeq && onSettle(opt.eventBattleOptionSeq)}
                                        className="rounded-lg border border-amber-700/80 bg-amber-950/40 px-4 py-2 text-sm text-amber-100 hover:bg-amber-900/40 disabled:opacity-50"
                                    >
                                        「{opt.label}」 승리
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={onCancelEvent}
                                    className="rounded-lg border border-rose-700/80 bg-rose-950/40 px-4 py-2 text-sm text-rose-100 hover:bg-rose-900/40 disabled:opacity-50"
                                >
                                    이벤트 취소
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {voteOnly ? (
                        <div className="mt-10 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-lg font-semibold text-white">투표 현황</h2>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        주제 순서는 상단 &quot;정렬&quot;과 동일합니다. 막대만 표시하며 숫자는 보이지
                                        않습니다.
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setVoteListSort("votes")}
                                            className={
                                                voteListSort === "votes"
                                                    ? "rounded-lg border border-violet-500/80 bg-violet-950/55 px-3 py-1.5 text-sm font-semibold text-violet-50 ring-1 ring-violet-500/45"
                                                    : "rounded-lg border border-slate-600/70 bg-slate-900/50 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/80"
                                            }
                                        >
                                            투표 많은 순
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVoteListSort("topic")}
                                            className={
                                                voteListSort === "topic"
                                                    ? "rounded-lg border border-violet-500/80 bg-violet-950/55 px-3 py-1.5 text-sm font-semibold text-violet-50 ring-1 ring-violet-500/45"
                                                    : "rounded-lg border border-slate-600/70 bg-slate-900/50 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/80"
                                            }
                                        >
                                            주제 번호 순
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={showAllVoteStatusDetails}
                                            className="rounded-lg border border-violet-600/80 bg-violet-950/40 px-3 py-1.5 text-sm font-semibold text-violet-100 hover:bg-violet-900/40"
                                        >
                                            전체보기
                                        </button>
                                        <button
                                            type="button"
                                            onClick={hideAllVoteStatusDetails}
                                            className="rounded-lg border border-slate-600/80 bg-slate-900/60 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/80"
                                        >
                                            전체숨기기
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <ul className="mt-3 space-y-3">
                                {voteOrderedOptions.map((opt) => {
                                    const seq = opt.eventBattleOptionSeq ?? 0;
                                    const v = opt.voteCount ?? 0;
                                    const pct = totalVoteCount > 0 ? Math.min(100, (v / totalVoteCount) * 100) : 0;
                                    const barVisible = voteStatusDetailBySeq[seq] === true;
                                    return (
                                        <li
                                            key={opt.eventBattleOptionSeq ?? opt.sortOrder}
                                            className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                                <span className="min-w-0 font-medium text-slate-100">{opt.label}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleVoteStatusDetail(seq)}
                                                    className="shrink-0 rounded-md border border-violet-500/50 bg-violet-950/30 px-2.5 py-1 text-xs font-semibold text-violet-100 hover:bg-violet-900/40"
                                                    aria-expanded={barVisible}
                                                >
                                                    {barVisible ? "숨기기" : "보기"}
                                                </button>
                                            </div>
                                            {barVisible ? (
                                                <div
                                                    className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"
                                                    role="progressbar"
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                    aria-valuenow={Math.round(pct)}
                                                    aria-label={`${(opt.label ?? "").trim() || "주제"} 상대 득표 비율`}
                                                >
                                                    <div
                                                        className="h-full rounded-full bg-violet-500/80"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ul>
                            {effectiveStatus === "SETTLED" && voteShareCelebration.rows.length > 0 ? (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setVoteResultCelebrationOpen(true)}
                                        className="rounded-xl border border-amber-500/70 bg-gradient-to-r from-amber-600/35 to-violet-600/35 px-5 py-2.5 text-sm font-bold text-amber-100 shadow-lg shadow-amber-900/20 hover:from-amber-500/45 hover:to-violet-500/45"
                                    >
                                        결과 발표 (폭죽)
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
                            <div className="min-w-0 max-lg:max-w-full">
                                <h2 className="text-lg font-semibold text-white">최근 베팅</h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    서버는 매번 {EVENT_BATTLE_RECENT_BETS_PAGE}건씩만 조회 · 스크롤 시 이전 내역 자동
                                    로드 · 이 화면 최대 {EVENT_BATTLE_RECENT_MAX_DISPLAY}건까지 표시
                                </p>
                                <ul
                                    ref={recentListScrollRef}
                                    className="mt-3 flex max-h-[22rem] flex-col gap-0 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50"
                                >
                                    {!isEventOpen ? (
                                        <li className="list-none border-b border-slate-700/90 bg-slate-900/70 px-4 py-4 text-center text-sm leading-relaxed text-slate-200">
                                            {effectiveStatus === "CANCELLED" ? (
                                                "이벤트가 취소되었습니다."
                                            ) : detail.winnerLabel?.trim() ? (
                                                <>
                                                    「
                                                    <span className="font-medium text-amber-200/95">
                                                        {detail.winnerLabel.trim()}
                                                    </span>
                                                    」 선택으로 종료되었습니다. 참가해 주신 분들 감사합니다.
                                                </>
                                            ) : (
                                                "선택으로 종료되었습니다. 참가해 주신 분들 감사합니다."
                                            )}
                                        </li>
                                    ) : null}
                                    {allRecentBets.map((b) => {
                                        const name = b.memberDisplayName?.trim() || "참가자";
                                        const label = b.optionLabel?.trim() || "?";
                                        const pts = b.pointAmount ?? 0;
                                        return (
                                            <li
                                                key={b.eventBattleBetSeq ?? `${name}-${b.createDt}-${pts}`}
                                                className="border-b border-slate-800/90 px-4 py-3 text-sm"
                                            >
                                                <p className="text-slate-200">
                                                    <span className="font-medium text-sky-300">{name}</span>님이{" "}
                                                    <span className="text-amber-100/95">「{label}」</span>에{" "}
                                                    <span className="font-semibold text-emerald-300">
                                                        {pts.toLocaleString()}포인트
                                                    </span>{" "}
                                                    베팅
                                                </p>
                                                {b.createDt ? (
                                                    <p className="mt-1 text-xs text-slate-600">{b.createDt}</p>
                                                ) : null}
                                            </li>
                                        );
                                    })}
                                    {canLoadMoreRecent ? (
                                        <li
                                            ref={recentSentinelRef}
                                            className="flex min-h-[2.75rem] list-none items-center justify-center border-t border-slate-800/80 px-4 py-2 text-xs text-slate-500"
                                        >
                                            {loadingOlderRecent
                                                ? "이전 베팅 불러오는 중…"
                                                : "아래로 스크롤하면 이전 베팅을 불러옵니다"}
                                        </li>
                                    ) : null}
                                </ul>
                                {allRecentBets.length === 0 && isEventOpen ? (
                                    <p className="mt-3 rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-600">
                                        베팅 내역이 없습니다.
                                    </p>
                                ) : null}
                                {allRecentBets.length > 0 &&
                                totalBetRows > EVENT_BATTLE_RECENT_MAX_DISPLAY &&
                                atRecentDisplayCap ? (
                                    <p className="mt-2 text-xs text-slate-500">
                                        이 화면에서는 최대 {EVENT_BATTLE_RECENT_MAX_DISPLAY.toLocaleString()}건까지만
                                        표시합니다. (이벤트 전체 베팅 {totalBetRows.toLocaleString()}건 — 서버는 항상
                                        소량씩만 조회합니다.)
                                    </p>
                                ) : null}
                            </div>
                            <aside className="min-w-0 rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
                                <h2 className="text-base font-semibold text-white">포인트 랭킹</h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    이 이벤트 누적 베팅액 상위 (닉네임 · 참가 주제 · 참가 포인트)
                                </p>
                                <div className="mt-3 overflow-x-auto">
                                    <div className="min-w-[20.1rem]">
                                        <div className="grid grid-cols-[2rem_minmax(0,1.15fr)_minmax(0,1fr)_auto] gap-x-2 gap-y-1 border-b border-slate-700/80 pb-2 text-[11px] font-medium text-slate-500">
                                            <span className="text-center">순위</span>
                                            <span>참가자 닉네임</span>
                                            <span>참가 주제</span>
                                            <span className="text-right tabular-nums">참가 포인트</span>
                                        </div>
                                        <ol className="mt-2 space-y-1.5">
                                            {(activity?.bettorRanking ?? []).map((r) => {
                                                const rankTopic = eventBattleRankTopicLabel(r);
                                                const pts = r.totalPoints ?? 0;
                                                return (
                                                    <li
                                                        key={`${r.rank}-${r.memberSeq}`}
                                                        className="grid grid-cols-[2rem_minmax(0,1.15fr)_minmax(0,1fr)_auto] items-start gap-x-2 gap-y-0.5 rounded-lg border border-slate-800/80 bg-[#0c1017] px-2 py-2 text-sm"
                                                    >
                                                        <span className="pt-0.5 text-center font-mono text-xs text-slate-500">
                                                            {r.rank}
                                                        </span>
                                                        <span
                                                            className="min-w-0 break-words font-medium leading-snug text-slate-100"
                                                            title={r.memberDisplayName ?? ""}
                                                        >
                                                            {r.memberDisplayName ?? "—"}
                                                        </span>
                                                        <span
                                                            className="min-w-0 break-words pt-0.5 leading-snug text-amber-100/95"
                                                            title={rankTopic ? `「${rankTopic}」` : ""}
                                                        >
                                                            {rankTopic ? `「${rankTopic}」` : "—"}
                                                        </span>
                                                        <span className="shrink-0 pt-0.5 text-right text-sm font-semibold tabular-nums text-emerald-400">
                                                            {pts.toLocaleString()} P
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                        {(activity?.bettorRanking ?? []).length === 0 ? (
                                            <p className="mt-4 text-center text-xs text-slate-600">
                                                랭킹 데이터가 없습니다.
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}
                </>
            )}

            <EventBattleResultCelebrationModal
                open={celebrationOpen}
                onClose={() => setCelebrationOpen(false)}
                winnerLabel={celebrationWinner}
                totalPool={celebrationTotalPool}
                winnerPayoutTop5={celebrationWinnerPayoutTop5}
                winnerOtherMemberCount={celebrationWinnerOtherCount}
                winnerOtherPayoutTotal={celebrationWinnerOtherTotal}
            />
            <VoteBattleResultCelebrationModal
                open={voteResultCelebrationOpen}
                onClose={() => setVoteResultCelebrationOpen(false)}
                headlineLabels={voteShareCelebration.headlineLabels}
                rows={voteShareCelebration.rows}
                isTie={voteShareCelebration.isTie}
                maxVotes={voteShareCelebration.maxVotes}
                winnerLabel={voteShareCelebration.winnerLabel}
                winnerVotes={voteShareCelebration.winnerVotes}
                totalVotes={voteShareCelebration.totalVotes}
                tieLabels={voteShareCelebration.tieLabels}
            />
            {rouletteOpen ? (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-[#0c1017] p-7 shadow-2xl">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white">승리 주제 룰렛</h3>
                            <button
                                type="button"
                                disabled={rouletteSpinning}
                                onClick={() => setRouletteOpen(false)}
                                className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40"
                            >
                                닫기
                            </button>
                        </div>
                        <p className="mb-5 text-base text-slate-300">
                            원판 룰렛을 돌린 뒤, 결과가 마음에 들면 `승리 확정`을 눌러 정산합니다.
                        </p>
                        <div className="grid gap-6 md:grid-cols-[460px_1fr]">
                            <div className="relative mx-auto h-[440px] w-[440px]">
                                <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 border-l-[14px] border-r-[14px] border-t-[26px] border-l-transparent border-r-transparent border-t-rose-400" />
                                <svg
                                    viewBox="0 0 320 320"
                                    className="h-full w-full"
                                    style={{
                                        transform: `rotate(${rouletteRotation}deg)`,
                                        transition: rouletteSpinning
                                            ? "transform 4.2s cubic-bezier(0.17, 0.85, 0.25, 1)"
                                            : "none",
                                    }}
                                >
                                    {options.map((opt, idx) => {
                                        const step = 360 / options.length;
                                        const start = idx * step;
                                        const end = start + step;
                                        const mid = start + step / 2;
                                        const colors = [
                                            "#0ea5e9",
                                            "#8b5cf6",
                                            "#f43f5e",
                                            "#f59e0b",
                                            "#10b981",
                                            "#6366f1",
                                        ];
                                        const fill = colors[idx % colors.length];
                                        const labelPos = polarToCartesian(160, 160, 102, mid);
                                        const baseTextAngle = mid;
                                        const uprightTextAngle =
                                            baseTextAngle > 90 && baseTextAngle < 270
                                                ? baseTextAngle + 180
                                                : baseTextAngle;
                                        return (
                                            <g key={`slice-${opt.eventBattleOptionSeq ?? idx}`}>
                                                <path
                                                    d={buildSectorPath(160, 160, 150, start, end)}
                                                    fill={fill}
                                                    stroke="#0b1220"
                                                    strokeWidth={2}
                                                    opacity={0.95}
                                                />
                                                <text
                                                    x={labelPos.x}
                                                    y={labelPos.y}
                                                    fill="#ffffff"
                                                    fontSize={22}
                                                    fontWeight={800}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    transform={`rotate(${uprightTextAngle}, ${labelPos.x}, ${labelPos.y})`}
                                                >
                                                    {truncateWheelLabel(opt.label)}
                                                </text>
                                            </g>
                                        );
                                    })}
                                    <circle cx="160" cy="160" r="28" fill="#0b1220" stroke="#94a3b8" strokeWidth="2" />
                                </svg>
                            </div>
                            <div>
                                <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-sm text-slate-300">
                                    <div className="mb-2 font-semibold text-slate-100">주제 목록</div>
                                    <ul className="space-y-1">
                                        {options.map((opt, idx) => (
                                            <li
                                                key={`opt-${opt.eventBattleOptionSeq ?? idx}`}
                                                className={`flex items-center justify-between gap-3 text-base ${idx === rouletteIndex ? "text-amber-300" : ""}`}
                                            >
                                                <span className="min-w-0 truncate">
                                                    {idx + 1}. {opt.label}
                                                </span>
                                                <span className="shrink-0 text-lg font-semibold text-slate-200">
                                                    {voteOnly
                                                        ? `${(opt.voteCount ?? 0).toLocaleString()} 표`
                                                        : `${(opt.pointsTotal ?? 0).toLocaleString()} P`}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-base">
                                    {rouletteWinnerSeq != null ? (
                                        <p className="text-emerald-300">
                                            룰렛 결과: <strong>「{options[rouletteIndex]?.label ?? "?"}」</strong>
                                        </p>
                                    ) : (
                                        <p className="text-slate-400">룰렛을 돌려 결과를 먼저 선택하세요.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onStartRoulette}
                                disabled={rouletteSpinning || busy}
                                className="rounded bg-violet-600 px-5 py-2.5 text-base font-semibold text-white disabled:opacity-50"
                            >
                                {rouletteSpinning ? "룰렛 회전 중..." : "룰렛 시작"}
                            </button>
                            <button
                                type="button"
                                onClick={() => void onConfirmRouletteWinner()}
                                disabled={rouletteSpinning || busy || rouletteWinnerSeq == null}
                                className="rounded bg-emerald-600 px-5 py-2.5 text-base font-semibold text-white disabled:opacity-50"
                            >
                                승리 확정
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
