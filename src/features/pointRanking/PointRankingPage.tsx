"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPointRanking, type PointRankingEntry } from "./api";

type Period = "DAY" | "WEEK" | "MONTH";

const PERIOD_LABEL: Record<Period, string> = {
    DAY: "일간",
    WEEK: "주간",
    MONTH: "월간",
};

/** 탭 표시 순서: 월간 → 주간 → 일간 */
const PERIOD_TAB_ORDER: Period[] = ["MONTH", "WEEK", "DAY"];

const TOP_SHOWN = 5;

export default function PointRankingPage() {
    const [period, setPeriod] = useState<Period>("MONTH");
    const [rows, setRows] = useState<PointRankingEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPointRanking(period);
            setRows(data);
        } catch (e) {
            setRows([]);
            setError(e instanceof Error ? e.message : "불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        void load();
    }, [load]);

    const topRows = rows.slice(0, TOP_SHOWN);
    const restRows = rows.slice(TOP_SHOWN);
    const restPersonCount = restRows.length;
    const restPointsTotal = restRows.reduce((sum, r) => sum + (r.pointsEarned ?? 0), 0);

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] p-6 text-slate-100 shadow-xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">포인트 랭킹</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        기간 내 원장에 기록된 <span className="text-slate-400">포인트 획득(양수)</span> 합계 기준입니다. (한국 시간) 상위{" "}
                        {TOP_SHOWN}명과 나머지 요약을 표시합니다.
                    </p>
                </div>
                <div className="flex gap-2">
                    {PERIOD_TAB_ORDER.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPeriod(p)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                period === p
                                    ? "bg-sky-600 text-white"
                                    : "border border-slate-600 text-slate-300 hover:bg-slate-800"
                            }`}
                        >
                            {PERIOD_LABEL[p]}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? <p className="text-sm text-slate-500">불러오는 중…</p> : null}
            {error ? (
                <div className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">{error}</div>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-slate-800">
                <div className="border-b border-slate-800 bg-gradient-to-r from-sky-950/50 to-violet-950/30 px-4 py-3">
                    <h2 className="text-sm font-semibold tracking-wide text-sky-200">TOP {TOP_SHOWN}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">이번 기간 기준 포인트 획득 상위 {TOP_SHOWN}명</p>
                </div>
                <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                            <th className="px-4 py-3 font-medium">순위</th>
                            <th className="px-4 py-3 font-medium">아이디</th>
                            <th className="px-4 py-3 font-medium">닉네임</th>
                            <th className="px-4 py-3 font-medium text-right">획득 포인트</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && rows.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                                    표시할 랭킹이 없습니다.
                                </td>
                            </tr>
                        ) : null}
                        {topRows.map((r) => (
                            <tr key={r.memberSeq} className="border-b border-slate-800/80 hover:bg-slate-900/40">
                                <td className="px-4 py-3 font-semibold text-sky-400">{r.rank}</td>
                                <td className="px-4 py-3 text-slate-200">{r.memberId}</td>
                                <td className="px-4 py-3 text-slate-300">{r.displayLabel ?? "—"}</td>
                                <td className="px-4 py-3 text-right align-top tabular-nums text-slate-100">
                                    <div className="font-medium">{r.pointsEarned.toLocaleString("ko-KR")} P</div>
                                    {r.breakdown && r.breakdown.length > 0 ? (
                                        <ul className="mt-2 space-y-0.5 text-left text-xs font-normal text-slate-500">
                                            {r.breakdown.map((b) => (
                                                <li key={`${r.memberSeq}-${b.reasonCode}`} className="flex justify-between gap-3">
                                                    <span className="min-w-0 truncate" title={b.reasonLabel}>
                                                        {b.reasonLabel}
                                                    </span>
                                                    <span className="shrink-0 tabular-nums text-slate-400">
                                                        +{b.points.toLocaleString("ko-KR")}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!loading && restPersonCount > 0 ? (
                <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-4 text-center text-sm leading-relaxed text-slate-300">
                    <span className="text-slate-400">그 외 </span>
                    <span className="font-semibold tabular-nums text-amber-200/95">{restPersonCount.toLocaleString("ko-KR")}명</span>
                    <span className="text-slate-400">이 총 </span>
                    <span className="font-semibold tabular-nums text-emerald-300/95">
                        {restPointsTotal.toLocaleString("ko-KR")}포인트
                    </span>
                    <span className="text-slate-400">를 획득하였습니다.</span>
                    {rows.length >= 100 ? (
                        <p className="mt-2 text-xs text-slate-600">(서버 집계 상위 100명까지 반영됩니다.)</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
