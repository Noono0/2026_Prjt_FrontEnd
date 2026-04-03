"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { VisitorOverview } from "@/features/analytics/api";

type RangeType = "daily" | "weekly" | "monthly";

type Props = {
    open: boolean;
    onClose: () => void;
    data: VisitorOverview | null;
    loading: boolean;
    error: string | null;
};

const RANGE_LABEL: Record<RangeType, string> = {
    daily: "일별",
    weekly: "주별",
    monthly: "월별",
};

export default function VisitorStatsModal({ open, onClose, data, loading, error }: Props) {
    const [range, setRange] = useState<RangeType>("daily");

    const rows = useMemo(() => {
        if (!data) return [];
        return range === "daily" ? data.daily : range === "weekly" ? data.weekly : data.monthly;
    }, [data, range]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-950 p-5 text-slate-100 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold">방문자 통계</h2>
                        <p className="text-sm text-slate-400">
                            현재 접속자 <span className="font-semibold text-emerald-400">{data?.onlineCount ?? 0}명</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {(["daily", "weekly", "monthly"] as RangeType[]).map((k) => (
                            <button
                                key={k}
                                type="button"
                                className={`rounded-lg border px-3 py-1.5 text-sm ${
                                    range === k
                                        ? "border-sky-500 bg-sky-500/20 text-sky-300"
                                        : "border-slate-600 text-slate-300 hover:bg-slate-800"
                                }`}
                                onClick={() => setRange(k)}
                            >
                                {RANGE_LABEL[k]}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
                            onClick={onClose}
                        >
                            닫기
                        </button>
                    </div>
                </div>

                <div className="h-[360px] rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">불러오는 중...</div>
                    ) : error ? (
                        <div className="flex h-full items-center justify-center text-sm text-rose-300">{error}</div>
                    ) : rows.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">데이터가 없습니다.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="label" stroke="#94a3b8" />
                                <YAxis allowDecimals={false} stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{
                                        background: "#020617",
                                        border: "1px solid #334155",
                                        borderRadius: 10,
                                        color: "#e2e8f0",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="visitors"
                                    stroke="#22d3ee"
                                    strokeWidth={3}
                                    dot={{ r: 3, stroke: "#06b6d4", fill: "#0891b2" }}
                                    activeDot={{ r: 5 }}
                                    name="방문자 수"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
