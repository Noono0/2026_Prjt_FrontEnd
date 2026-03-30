"use client";

import { useCallback, useEffect, useState } from "react";
import {
    exchangeGoldToDiamond,
    exchangeIronToSilver,
    exchangeSilverToGold,
    fetchMyWallet,
    fetchMyWalletLedger,
    purchaseIron,
    type MemberWalletSummary,
    type WalletLedgerRow,
} from "./walletApi";
import { bumpWalletRefresh } from "@/stores/walletRefreshStore";

function fmt(n: number | undefined | null) {
    if (n == null || Number.isNaN(n)) return "0";
    return Number(n).toLocaleString("ko-KR");
}

function fmtDelta(n: number | undefined | null) {
    if (n == null || n === 0) return "—";
    return n > 0 ? `+${fmt(n)}` : fmt(n);
}

export default function WalletSection() {
    const [wallet, setWallet] = useState<MemberWalletSummary | null>(null);
    const [ledger, setLedger] = useState<WalletLedgerRow[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [size] = useState(15);
    const [loading, setLoading] = useState(false);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [qtyIron, setQtyIron] = useState(1);
    const [timesEx, setTimesEx] = useState(1);

    const loadWallet = useCallback(async () => {
        try {
            setLoading(true);
            const w = await fetchMyWallet();
            setWallet(w);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadLedger = useCallback(async () => {
        try {
            setLedgerLoading(true);
            const res = await fetchMyWalletLedger(page, size);
            setLedger(res.items ?? []);
            setTotal(res.totalCount ?? 0);
        } catch (e) {
            console.error(e);
            setLedger([]);
        } finally {
            setLedgerLoading(false);
        }
    }, [page, size]);

    const refreshAfterMutation = useCallback(async () => {
        await loadWallet();
        bumpWalletRefresh();
        const res = await fetchMyWalletLedger(1, size);
        setLedger(res.items ?? []);
        setTotal(res.totalCount ?? 0);
        setPage(1);
    }, [loadWallet, size]);

    useEffect(() => {
        void loadWallet();
    }, [loadWallet]);

    useEffect(() => {
        void loadLedger();
    }, [loadLedger]);

    const rates = wallet?.rates;
    const totalPages = Math.max(1, Math.ceil(total / size));

    const onPurchaseIron = async () => {
        try {
            await purchaseIron(qtyIron);
            alert("아이언 티켓을 구매했습니다.");
            await refreshAfterMutation();
        } catch (e) {
            alert(e instanceof Error ? e.message : "구매 실패");
        }
    };

    const ex = async (fn: (t: number) => Promise<void>) => {
        try {
            await fn(timesEx);
            alert("교환되었습니다.");
            await refreshAfterMutation();
        } catch (e) {
            alert(e instanceof Error ? e.message : "교환 실패");
        }
    };

    return (
        <div className="space-y-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <div>
                <h2 className="text-lg font-semibold text-white">포인트 · 티켓</h2>
                <p className="mt-1 text-xs text-slate-500">
                    포인트는 이벤트·관리자 지급 등으로 적립됩니다. 티켓은 향후 이벤트에 사용할 수 있습니다.
                </p>
            </div>

            {loading && !wallet ? (
                <p className="text-sm text-slate-400">불러오는 중…</p>
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="rounded-lg border border-slate-700 bg-[#081326] p-3">
                            <div className="text-xs text-slate-500">포인트</div>
                            <div className="text-xl font-bold text-sky-400">{fmt(wallet?.pointBalance)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-[#081326] p-3">
                            <div className="text-xs text-slate-500">아이언</div>
                            <div className="text-xl font-bold text-slate-200">{fmt(wallet?.ironQty)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-[#081326] p-3">
                            <div className="text-xs text-slate-500">실버</div>
                            <div className="text-xl font-bold text-slate-300">{fmt(wallet?.silverQty)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-[#081326] p-3">
                            <div className="text-xs text-slate-500">골드</div>
                            <div className="text-xl font-bold text-amber-200">{fmt(wallet?.goldQty)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-[#081326] p-3">
                            <div className="text-xs text-slate-500">다이아</div>
                            <div className="text-xl font-bold text-cyan-200">{fmt(wallet?.diamondQty)}</div>
                        </div>
                    </div>

                    {rates && (
                        <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-400">
                            교환 규칙: {rates.pointsPerIron}P → 아이언 1장 · 아이언 {rates.ironPerSilver}장 → 실버 1장 · 실버{" "}
                            {rates.silverPerGold}장 → 골드 1장 · 골드 {rates.goldPerDiamond}장 → 다이아 1장
                        </div>
                    )}

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2 rounded-lg border border-slate-700 p-3">
                            <div className="text-sm font-medium text-slate-300">아이언 구매 (포인트 차감)</div>
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    className="w-24 rounded border border-slate-600 bg-[#081326] px-2 py-1 text-sm"
                                    value={qtyIron}
                                    onChange={(e) => setQtyIron(Math.max(1, Number(e.target.value) || 1))}
                                />
                                <span className="text-xs text-slate-500">장</span>
                                <button
                                    type="button"
                                    onClick={onPurchaseIron}
                                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500"
                                >
                                    구매
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 rounded-lg border border-slate-700 p-3">
                            <div className="text-sm font-medium text-slate-300">티켓 교환 (횟수)</div>
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    className="w-24 rounded border border-slate-600 bg-[#081326] px-2 py-1 text-sm"
                                    value={timesEx}
                                    onChange={(e) => setTimesEx(Math.max(1, Number(e.target.value) || 1))}
                                />
                                <span className="text-xs text-slate-500">회씩</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800"
                                    onClick={() => ex(exchangeIronToSilver)}
                                >
                                    아이언→실버
                                </button>
                                <button
                                    type="button"
                                    className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800"
                                    onClick={() => ex(exchangeSilverToGold)}
                                >
                                    실버→골드
                                </button>
                                <button
                                    type="button"
                                    className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800"
                                    onClick={() => ex(exchangeGoldToDiamond)}
                                >
                                    골드→다이아
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-300">포인트·티켓 내역</h3>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-slate-800 bg-slate-950/80 text-xs text-slate-500">
                            <tr>
                                <th className="px-2 py-2">일시</th>
                                <th className="px-2 py-2">내용</th>
                                <th className="px-2 py-2 text-right">포인트</th>
                                <th className="px-2 py-2 text-right">아이언</th>
                                <th className="px-2 py-2 text-right">실버</th>
                                <th className="px-2 py-2 text-right">골드</th>
                                <th className="px-2 py-2 text-right">다이아</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledgerLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-2 py-6 text-center text-slate-500">
                                        불러오는 중…
                                    </td>
                                </tr>
                            ) : ledger.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-2 py-6 text-center text-slate-500">
                                        내역이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                ledger.map((row) => (
                                    <tr key={row.ledgerSeq} className="border-b border-slate-800/80">
                                        <td className="whitespace-nowrap px-2 py-2 text-slate-400">{row.createDt}</td>
                                        <td className="max-w-[280px] px-2 py-2 text-slate-300">{row.summary}</td>
                                        <td className="px-2 py-2 text-right font-mono text-xs">{fmtDelta(row.pointDelta)}</td>
                                        <td className="px-2 py-2 text-right font-mono text-xs">{fmtDelta(row.ironDelta)}</td>
                                        <td className="px-2 py-2 text-right font-mono text-xs">{fmtDelta(row.silverDelta)}</td>
                                        <td className="px-2 py-2 text-right font-mono text-xs">{fmtDelta(row.goldDelta)}</td>
                                        <td className="px-2 py-2 text-right font-mono text-xs">{fmtDelta(row.diamondDelta)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {total > size && (
                    <div className="mt-2 flex items-center justify-center gap-3 text-sm text-slate-400">
                        <button
                            type="button"
                            disabled={page <= 1}
                            className="rounded border border-slate-600 px-2 py-1 disabled:opacity-40"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            이전
                        </button>
                        <span>
                            {page} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            className="rounded border border-slate-600 px-2 py-1 disabled:opacity-40"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            다음
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
