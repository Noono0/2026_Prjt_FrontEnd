"use client";

import { useEffect, useState } from "react";
import { fetchCalendarScheduleDetail } from "./api";
import type { CalendarScheduleDetail } from "./types";

type Props = {
    open: boolean;
    onClose: () => void;
    scheduleSeq: number | null;
};

function formatTimeForInput(t?: string | null): string {
    if (!t?.trim()) return "";
    const s = t.trim();
    return s.length >= 5 ? s.slice(0, 5) : s;
}

export default function ScheduleDetailModal({ open, onClose, scheduleSeq }: Props) {
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState<CalendarScheduleDetail | null>(null);

    useEffect(() => {
        if (!open || scheduleSeq == null) {
            setDetail(null);
            return;
        }
        setLoading(true);
        void (async () => {
            try {
                const d = await fetchCalendarScheduleDetail(scheduleSeq);
                setDetail(d);
            } catch (e) {
                alert(e instanceof Error ? e.message : "불러오지 못했습니다.");
                onClose();
            } finally {
                setLoading(false);
            }
        })();
    }, [open, scheduleSeq, onClose]);

    if (!open || scheduleSeq == null) {
        return null;
    }

    const kind = detail?.eventKind === "BIRTHDAY" ? "생일 (매년)" : "일정";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal
        >
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0c1017] shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 py-4">
                    <h2 className="text-lg font-semibold text-white">일정 상세</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-3 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        닫기
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-slate-500">불러오는 중…</div>
                ) : detail ? (
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{kind}</div>
                        <h3 className="text-xl font-semibold text-white">{detail.title ?? "(제목 없음)"}</h3>

                        <dl className="mt-4 space-y-2 text-sm text-slate-300">
                            {detail.categoryName || detail.categoryCode ? (
                                <div className="flex flex-wrap gap-2">
                                    <dt className="text-slate-500">카테고리</dt>
                                    <dd>{detail.categoryName ?? detail.categoryCode ?? "-"}</dd>
                                </div>
                            ) : null}
                            {detail.eventColor ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <dt className="text-slate-500">달력 색</dt>
                                    <dd className="flex items-center gap-2">
                                        <span
                                            className="inline-block h-5 w-5 rounded border border-slate-600"
                                            style={{ backgroundColor: detail.eventColor }}
                                            title={detail.eventColor}
                                        />
                                        <span className="font-mono text-xs text-slate-400">{detail.eventColor}</span>
                                    </dd>
                                </div>
                            ) : null}
                            {detail.createId ? (
                                <div className="flex flex-wrap gap-2">
                                    <dt className="text-slate-500">등록자</dt>
                                    <dd>{detail.createId}</dd>
                                </div>
                            ) : null}
                            {detail.eventKind === "GENERAL" ? (
                                <>
                                    <div className="flex flex-wrap gap-2">
                                        <dt className="text-slate-500">기간</dt>
                                        <dd>
                                            {detail.startDate ?? "—"}
                                            {detail.endDate && detail.endDate !== detail.startDate
                                                ? ` ~ ${detail.endDate} (포함)`
                                                : ""}
                                        </dd>
                                    </div>
                                    {(formatTimeForInput(detail.startTime) || formatTimeForInput(detail.endTime)) && (
                                        <div className="flex flex-wrap gap-2">
                                            <dt className="text-slate-500">시간</dt>
                                            <dd>
                                                {formatTimeForInput(detail.startTime) || "—"} ~{" "}
                                                {formatTimeForInput(detail.endTime) || "—"}
                                            </dd>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    <dt className="text-slate-500">생일</dt>
                                    <dd>
                                        {detail.birthMonth ?? "—"}월 {detail.birthDay ?? "—"}일
                                    </dd>
                                </div>
                            )}
                            {detail.createDt ? (
                                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                    <dt>등록일</dt>
                                    <dd>{detail.createDt}</dd>
                                </div>
                            ) : null}
                        </dl>

                        <div className="mt-6 border-t border-slate-800 pt-4">
                            <div className="mb-2 text-xs font-medium text-slate-500">내용</div>
                            <div
                                className="board-detail-content prose prose-invert max-w-none break-words text-slate-100"
                                dangerouslySetInnerHTML={{
                                    __html: detail.content?.trim() ? detail.content : "<p></p>",
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="py-12 text-center text-slate-500">내용이 없습니다.</div>
                )}

                <div className="flex shrink-0 justify-end border-t border-slate-800 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
