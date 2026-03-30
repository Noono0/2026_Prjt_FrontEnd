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
    settleEventBattle,
    type EventBattleActivity,
    type EventBattleBetRow,
    type EventBattleBettorRank,
    type EventBattleListItem,
    type EventBattleOption,
    type EventBattleWinnerPayoutRow,
} from "./api";
import EventBattleResultCelebrationModal from "./EventBattleResultCelebrationModal";
import styles from "./EventBattleDetailPage.module.css";

const BET_STEP = 100;
const BET_DEFAULT = 1000;
const BET_MIN = 100;

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

function OptionBetCard({
    opt,
    disabled,
    lockedOther,
    busy,
    pointBalance,
    onBet,
}: {
    opt: EventBattleOption;
    disabled: boolean;
    lockedOther: boolean;
    busy: boolean;
    pointBalance: number | null;
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
    const canBetAmount =
        maxPts != null && maxPts >= BET_MIN && localPts >= BET_MIN && localPts <= maxPts;
    const cardDisabled = disabled || lockedOther || busy || optSeq < 1;

    return (
        <div className={styles.card}>
            <div className={styles.cardInner}>
                <div className={styles.badge}>주제 {opt.sortOrder}</div>
                <h3 className={styles.label}>{opt.label}</h3>
                <div className={styles.poolTotal}>{total.toLocaleString()} P</div>
                <p className={styles.poolHint}>이 주제에 걸린 포인트 합계</p>
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
    }, [eventBattleSeq]);

    const loadDetail = useCallback(async () => {
        try {
            const d = await getEventBattle(eventBattleSeq);
            setDetail(d);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "상세 조회 실패");
        }
    }, [eventBattleSeq]);

    const pollActivity = useCallback(async () => {
        try {
            const a = await getEventBattleActivity(eventBattleSeq, {
                recentLimit: EVENT_BATTLE_RECENT_BETS_PAGE,
            });
            setActivity(a);
            setErr(null);
        } catch {
            /* ignore */
        }
    }, [eventBattleSeq]);

    useEffect(() => {
        void loadDetail();
    }, [loadDetail]);

    useEffect(() => {
        if (!user?.memberSeq) {
            setPointBalance(null);
            return;
        }
        void fetchMyWallet()
            .then((w) => setPointBalance(w.pointBalance ?? 0))
            .catch(() => setPointBalance(null));
    }, [user?.memberSeq, walletTick]);

    /** 폴링·UI 공통: activity가 더 자주 갱신되므로 우선 */
    const effectiveStatus = activity?.status ?? detail?.status;
    const isEventOpen = effectiveStatus === "OPEN";

    const shouldPoll = useMemo(() => {
        if (effectiveStatus != null && effectiveStatus !== "OPEN") return false;
        return true;
    }, [effectiveStatus]);

    useEffect(() => {
        void pollActivity();
    }, [pollActivity]);

    /** activity가 먼저 종료로 바뀌면 상세(정산일·승리 주제) 즉시 맞춤 */
    useEffect(() => {
        const a = activity?.status;
        const d = detail?.status;
        if (a != null && a !== "OPEN" && d === "OPEN") {
            void loadDetail();
        }
    }, [activity?.status, detail?.status, loadDetail]);

    useEffect(() => {
        if (!shouldPoll) return;
        const t = window.setInterval(() => void pollActivity(), 2500);
        return () => window.clearInterval(t);
    }, [pollActivity, shouldPoll]);

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
            setCelebratePending(true);
        }
    }, [effectiveStatus]);

    const mergedOptions: EventBattleOption[] = useMemo(
        () => (activity?.options?.length ? activity.options : detail?.options ?? []),
        [activity?.options, detail?.options]
    );

    useEffect(() => {
        if (!celebratePending) return;
        if (effectiveStatus !== "SETTLED") {
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
            await pollActivity();
            await loadDetail();
        } catch (e) {
            alert(e instanceof Error ? e.message : "베팅 실패");
        } finally {
            setBusy(false);
        }
    };

    const onSettle = async (winnerOptionSeq: number) => {
        const label = activity?.options?.find((o) => o.eventBattleOptionSeq === winnerOptionSeq)?.label ?? "?";
        if (!confirm(`승리 주제: 「${label}」 — 정산할까요?`)) return;
        try {
            setBusy(true);
            await settleEventBattle(eventBattleSeq, winnerOptionSeq);
            bumpWalletRefresh();
            await loadDetail();
            await pollActivity();
        } catch (e) {
            alert(e instanceof Error ? e.message : "정산 실패");
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
        const seqs = combined
            .map((b) => b.eventBattleBetSeq)
            .filter((s): s is number => s != null && s > 0);
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
    const hasBet =
        myBetHistory.length > 0 || (myBet != null && (myBet.pointAmount ?? 0) > 0);
    const myOptSeq = myBet?.eventBattleOptionSeq ?? myBetHistory[0]?.eventBattleOptionSeq;
    const options = mergedOptions;

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] p-6 text-slate-100 shadow-xl">
            <div className="mb-4">
                <Link href="/event-battles" className="text-sm text-sky-400 hover:underline">
                    ← 목록
                </Link>
            </div>

            {err ? (
                <div className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">{err}</div>
            ) : null}

            {!detail ? (
                <p className="text-slate-500">불러오는 중…</p>
            ) : (
                <>
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                        <h1 className="text-2xl font-bold text-white">{detail.title}</h1>
                        {effectiveStatus === "OPEN" ? (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/35">
                                진행중
                            </span>
                        ) : effectiveStatus === "SETTLED" ? (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-slate-600/40 px-2.5 py-0.5 text-xs font-semibold text-slate-200 ring-1 ring-slate-500/50">
                                종료
                            </span>
                        ) : effectiveStatus === "CANCELLED" ? (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-500/35">
                                취소
                            </span>
                        ) : effectiveStatus ? (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs text-slate-400">
                                {effectiveStatus}
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
                                        · 승리 주제:{" "}
                                        <span className="text-emerald-400">「{detail.winnerLabel}」</span>
                                    </>
                                ) : null}
                            </>
                        ) : (
                            <span>
                                {isEventOpen
                                    ? "베팅이 진행 중입니다."
                                    : effectiveStatus === "CANCELLED"
                                      ? "이벤트가 취소되었습니다."
                                      : "이벤트가 종료되었습니다."}
                            </span>
                        )}
                    </p>

                    {hasBet && user?.memberSeq ? (
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

                    <div className="mt-4 text-sm text-slate-400">
                        총 풀: <span className="text-slate-200">{(activity?.totalPool ?? 0).toLocaleString()} P</span> · 참여자{" "}
                        <span className="text-slate-200">{activity?.participantCount ?? 0}</span>명 · 베팅{" "}
                        <span className="text-slate-200">{activity?.betCount ?? 0}</span>건
                        {shouldPoll ? (
                            <span className="ml-2 text-xs text-slate-600">(약 2.5초마다 갱신)</span>
                        ) : (
                            <span className="ml-2 text-xs text-slate-600">(종료됨)</span>
                        )}
                    </div>

                    <div className={styles.grid}>
                        {options.map((opt) => {
                            const seq = opt.eventBattleOptionSeq ?? 0;
                            const lockedOther = Boolean(hasBet && myOptSeq != null && myOptSeq !== seq);
                            return (
                                <OptionBetCard
                                    key={opt.eventBattleOptionSeq ?? opt.sortOrder}
                                    opt={opt}
                                    disabled={!open}
                                    lockedOther={lockedOther}
                                    busy={busy}
                                    pointBalance={pointBalance}
                                    onBet={onBet}
                                />
                            );
                        })}
                    </div>

                    {open && isCreator ? (
                        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                            <div className="mb-2 text-sm font-medium text-slate-300">승리 주제 확정 (작성자)</div>
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
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
                        <div className="min-w-0 max-lg:max-w-full">
                            <h2 className="text-lg font-semibold text-white">최근 베팅</h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                서버는 매번 {EVENT_BATTLE_RECENT_BETS_PAGE}건씩만 조회 · 스크롤 시 이전 내역 자동 로드 · 이 화면 최대{" "}
                                {EVENT_BATTLE_RECENT_MAX_DISPLAY}건까지 표시
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
                                                <span className="font-semibold text-emerald-300">{pts.toLocaleString()}포인트</span>{" "}
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
                                        {loadingOlderRecent ? "이전 베팅 불러오는 중…" : "아래로 스크롤하면 이전 베팅을 불러옵니다"}
                                    </li>
                                ) : null}
                            </ul>
                            {allRecentBets.length === 0 && isEventOpen ? (
                                <p className="mt-3 rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-600">
                                    베팅 내역이 없습니다.
                                </p>
                            ) : null}
                            {allRecentBets.length > 0 && totalBetRows > EVENT_BATTLE_RECENT_MAX_DISPLAY && atRecentDisplayCap ? (
                                <p className="mt-2 text-xs text-slate-500">
                                    이 화면에서는 최대 {EVENT_BATTLE_RECENT_MAX_DISPLAY.toLocaleString()}건까지만 표시합니다. (이벤트 전체 베팅{" "}
                                    {totalBetRows.toLocaleString()}건 — 서버는 항상 소량씩만 조회합니다.)
                                </p>
                            ) : null}
                        </div>
                        <aside className="min-w-0 rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
                            <h2 className="text-base font-semibold text-white">포인트 랭킹</h2>
                            <p className="mt-0.5 text-xs text-slate-500">이 이벤트 누적 베팅액 상위 (닉네임 · 참가 주제 · 참가 포인트)</p>
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
                                            <span className="pt-0.5 text-center font-mono text-xs text-slate-500">{r.rank}</span>
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
                                <p className="mt-4 text-center text-xs text-slate-600">랭킹 데이터가 없습니다.</p>
                            ) : null}
                            </div>
                            </div>
                        </aside>
                    </div>
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
        </div>
    );
}
