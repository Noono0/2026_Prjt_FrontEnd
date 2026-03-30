"use client";

import { useCallback, useEffect, useState } from "react";
import BoardEditor from "@/components/editor/BoardEditor";
import {
    createCalendarSchedule,
    deleteCalendarSchedule,
    fetchCalendarScheduleCategories,
    fetchCalendarScheduleDetail,
    updateCalendarSchedule,
} from "./api";
import type { CalendarScheduleSaveBody, ScheduleCategoryOption } from "./types";
import { SCHEDULE_COLOR_PALETTE, pickRandomScheduleColor } from "./scheduleColors";

function todayYmd(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatTimeForInput(t?: string | null): string {
    if (!t?.trim()) return "";
    const s = t.trim();
    return s.length >= 5 ? s.slice(0, 5) : s;
}

/** &lt;input type="color"&gt; 은 #RRGGBB 만 허용 */
function toColorInputValue(hex: string): string {
    const h = hex.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(h)) {
        return h;
    }
    if (/^#[0-9a-fA-F]{3}$/.test(h) && h.length === 4) {
        return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
    }
    return "#0ea5e9";
}

type Props = {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    editingSeq: number | null;
    /** 신규 작성 시 초기 선택일 (yyyy-MM-dd) */
    initialDate: string | null;
    /** 드래그 구간 등 종료일 (없으면 시작일과 동일) */
    initialEndDate: string | null;
};

export default function ScheduleWriteModal({ open, onClose, onSaved, editingSeq, initialDate, initialEndDate }: Props) {
    const [eventKind, setEventKind] = useState<"GENERAL" | "BIRTHDAY">("GENERAL");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("<p></p>");
    const [startDate, setStartDate] = useState(todayYmd());
    const [endDate, setEndDate] = useState(todayYmd());
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [birthMonth, setBirthMonth] = useState(1);
    const [birthDay, setBirthDay] = useState(1);
    const [categoryCode, setCategoryCode] = useState("");
    const [eventColor, setEventColor] = useState(() => pickRandomScheduleColor());
    const [categoryOptions, setCategoryOptions] = useState<ScheduleCategoryOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const resetForCreate = useCallback(() => {
        setEventKind("GENERAL");
        setTitle("");
        setContent("<p></p>");
        const s = initialDate ?? todayYmd();
        const e = initialEndDate ?? s;
        setStartDate(s);
        setEndDate(e >= s ? e : s);
        setStartTime("");
        setEndTime("");
        setBirthMonth(1);
        setBirthDay(1);
        setCategoryCode("");
        setEventColor(pickRandomScheduleColor());
    }, [initialDate, initialEndDate]);

    useEffect(() => {
        if (!open) return;
        void (async () => {
            try {
                const opts = await fetchCalendarScheduleCategories();
                setCategoryOptions(opts);
            } catch {
                setCategoryOptions([]);
            }
        })();
    }, [open]);

    useEffect(() => {
        if (!open) return;

        if (editingSeq != null) {
            setLoading(true);
            void (async () => {
                try {
                    const detail = await fetchCalendarScheduleDetail(editingSeq);
                    const k = detail.eventKind === "BIRTHDAY" ? "BIRTHDAY" : "GENERAL";
                    setEventKind(k);
                    setTitle(detail.title ?? "");
                    setContent(detail.content && detail.content.trim() ? detail.content : "<p></p>");
                    setCategoryCode(detail.categoryCode?.trim() ?? "");
                    setEventColor(
                        detail.eventColor?.trim() && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(detail.eventColor.trim())
                            ? detail.eventColor.trim()
                            : pickRandomScheduleColor()
                    );
                    if (k === "GENERAL") {
                        setStartDate(detail.startDate ?? todayYmd());
                        setEndDate(detail.endDate ?? detail.startDate ?? todayYmd());
                        setStartTime(formatTimeForInput(detail.startTime));
                        setEndTime(formatTimeForInput(detail.endTime));
                    } else {
                        setBirthMonth(detail.birthMonth ?? 1);
                        setBirthDay(detail.birthDay ?? 1);
                        setStartTime("");
                        setEndTime("");
                    }
                } catch (e) {
                    alert(e instanceof Error ? e.message : "불러오지 못했습니다.");
                    onClose();
                } finally {
                    setLoading(false);
                }
            })();
        } else {
            resetForCreate();
        }
    }, [open, editingSeq, initialDate, initialEndDate, onClose, resetForCreate]);

    if (!open) {
        return null;
    }

    const buildBody = (): CalendarScheduleSaveBody => {
        if (eventKind === "GENERAL") {
            return {
                calendarScheduleSeq: editingSeq ?? undefined,
                eventKind: "GENERAL",
                title: title.trim(),
                categoryCode: categoryCode.trim() || null,
                eventColor: eventColor.trim() || null,
                content,
                startDate,
                endDate,
                startTime: startTime.trim() ? startTime.trim() : null,
                endTime: endTime.trim() ? endTime.trim() : null,
            };
        }
        return {
            calendarScheduleSeq: editingSeq ?? undefined,
            eventKind: "BIRTHDAY",
            title: title.trim(),
            categoryCode: categoryCode.trim() || null,
            eventColor: eventColor.trim() || null,
            content,
            birthMonth,
            birthDay,
        };
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        if (eventKind === "GENERAL") {
            if (!startDate || !endDate) {
                alert("시작일·종료일을 선택해주세요.");
                return;
            }
            if (startDate > endDate) {
                alert("시작일이 종료일보다 늦을 수 없습니다.");
                return;
            }
        } else {
            if (birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 31) {
                alert("생일 월·일을 확인해주세요.");
                return;
            }
        }

        setSaving(true);
        try {
            const body = buildBody();
            if (editingSeq != null) {
                const n = await updateCalendarSchedule(body);
                if (n <= 0) {
                    alert("수정에 실패했습니다.");
                    return;
                }
            } else {
                const n = await createCalendarSchedule(body);
                if (n <= 0) {
                    alert("등록에 실패했습니다.");
                    return;
                }
            }
            onSaved();
            onClose();
        } catch (err) {
            alert(err instanceof Error ? err.message : "저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        if (editingSeq == null) return;
        if (!window.confirm("이 일정을 삭제할까요?")) return;
        setSaving(true);
        try {
            const n = await deleteCalendarSchedule(editingSeq);
            if (n <= 0) {
                alert("삭제에 실패했습니다.");
                return;
            }
            onSaved();
            onClose();
        } catch (err) {
            alert(err instanceof Error ? err.message : "삭제에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal>
            <div className="flex max-h-[92vh] w-full max-w-[min(1120px,98vw)] min-w-[min(100%,560px)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0c1017] shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-5 py-4">
                    <h2 className="text-lg font-semibold text-white">{editingSeq ? "일정 수정" : "일정 등록"}</h2>
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
                ) : (
                    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
                        <div className="mb-4 flex flex-wrap gap-4">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                                <input
                                    type="radio"
                                    name="kind"
                                    checked={eventKind === "GENERAL"}
                                    onChange={() => setEventKind("GENERAL")}
                                    className="accent-sky-500"
                                />
                                일정
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                                <input
                                    type="radio"
                                    name="kind"
                                    checked={eventKind === "BIRTHDAY"}
                                    onChange={() => setEventKind("BIRTHDAY")}
                                    className="accent-sky-500"
                                />
                                생일 (매년 반복)
                            </label>
                        </div>

                        <div className="mb-3">
                            <div className="mb-1 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                                <span>카테고리 (A0003, 선택)</span>
                                <span>{eventKind === "BIRTHDAY" ? "이름" : "제목"}</span>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                                <select
                                    value={categoryCode}
                                    onChange={(e) => setCategoryCode(e.target.value)}
                                    className="h-10 w-full shrink-0 rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100 sm:w-[min(100%,220px)]"
                                    disabled={saving}
                                >
                                    <option value="">선택</option>
                                    {categoryOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-10 min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                                    placeholder={eventKind === "BIRTHDAY" ? "표시할 이름" : "제목"}
                                    maxLength={500}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="mb-2 text-xs font-medium text-slate-500">달력 색상</div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex flex-wrap gap-2">
                                    {SCHEDULE_COLOR_PALETTE.map((hex) => (
                                        <button
                                            key={hex}
                                            type="button"
                                            title={hex}
                                            onClick={() => setEventColor(hex)}
                                            disabled={saving}
                                            className={`h-9 w-9 rounded-lg border-2 transition ${
                                                eventColor === hex
                                                    ? "border-white ring-2 ring-sky-400 ring-offset-2 ring-offset-[#0c1017]"
                                                    : "border-transparent"
                                            }`}
                                            style={{ backgroundColor: hex }}
                                        />
                                    ))}
                                </div>
                                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                                    <span>직접</span>
                                    <input
                                        type="color"
                                        value={toColorInputValue(eventColor)}
                                        onChange={(e) => setEventColor(e.target.value)}
                                        disabled={saving}
                                        className="h-9 w-14 cursor-pointer rounded border border-slate-600 bg-transparent p-0"
                                    />
                                </label>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                새 일정은 미선택 시 자동으로 팔레트 중 하나가 적용됩니다.
                            </p>
                        </div>

                        {eventKind === "GENERAL" ? (
                            <div className="mb-4 space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-medium text-slate-500">시작일</div>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-xs font-medium text-slate-500">종료일 (포함)</div>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-xs font-medium text-slate-500">시작 시각 (선택)</div>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-xs font-medium text-slate-500">종료 시각 (선택)</div>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">시간을 비우면 종일 일정으로 달력에 표시됩니다.</p>
                            </div>
                        ) : (
                            <div className="mb-4 flex flex-wrap gap-3">
                                <div>
                                    <div className="mb-1 text-xs font-medium text-slate-500">월</div>
                                    <input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={birthMonth}
                                        onChange={(e) => setBirthMonth(Number(e.target.value) || 1)}
                                        className="h-10 w-24 rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 text-xs font-medium text-slate-500">일</div>
                                    <input
                                        type="number"
                                        min={1}
                                        max={31}
                                        value={birthDay}
                                        onChange={(e) => setBirthDay(Number(e.target.value) || 1)}
                                        className="h-10 w-24 rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mb-2 text-xs font-medium text-slate-500">내용</div>
                        <div className="min-h-[240px] max-w-full overflow-x-auto rounded-lg border border-slate-800 bg-[#081326] p-1">
                            <BoardEditor value={content} onChange={setContent} disabled={saving} />
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 pt-4">
                            {editingSeq != null ? (
                                <button
                                    type="button"
                                    onClick={() => void onDelete()}
                                    disabled={saving}
                                    className="mr-auto rounded-lg border border-rose-900 bg-rose-950/50 px-4 py-2 text-sm text-rose-200 hover:bg-rose-950 disabled:opacity-50"
                                >
                                    삭제
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                            >
                                {saving ? "저장 중…" : "저장"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
