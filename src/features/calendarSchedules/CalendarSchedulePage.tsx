"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import koLocale from "@fullcalendar/core/locales/ko";
import type {
    DateSelectArg,
    DatesSetArg,
    DayCellContentArg,
    DayHeaderContentArg,
    EventClickArg,
} from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";
import { fetchCalendarEvents } from "./api";
import ScheduleWriteModal from "./ScheduleWriteModal";
import ScheduleDetailModal from "./ScheduleDetailModal";
import { getKoreaPublicHolidayNames, isKoreaPublicHoliday } from "@/lib/koreaHolidays";
import { useAuthStore } from "@/stores/authStore";
import styles from "./CalendarSchedulePage.module.css";

const FullCalendar = dynamic(() => import("@fullcalendar/react").then((m) => m.default), {
    ssr: false,
    loading: () => (
        <div className="rounded-xl border border-slate-800 bg-[#0c1017] py-24 text-center text-slate-500">달력 불러오는 중…</div>
    ),
});

function toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function exclusiveEndToInclusiveLastDay(endExclusive: Date): string {
    const d = new Date(endExclusive.getTime() - 86400000);
    return toYmd(d);
}

function parseScheduleSeqFromEventId(eventId: string): number {
    const i = eventId.indexOf("-");
    if (i <= 0) return Number(eventId);
    return Number(eventId.slice(0, i));
}

function isScheduleOwner(loginId: string | undefined | null, createId: string | undefined | null): boolean {
    if (!loginId?.trim()) return false;
    if (createId == null || !String(createId).trim()) return false;
    return loginId.trim() === String(createId).trim();
}

/** 달력·목록에 표시할 제목: `[카테고리명] 제목` */
function scheduleListTitle(categoryName: string | null | undefined, coreTitle: string): string {
    const t = (coreTitle ?? "").trim();
    const c = categoryName?.trim();
    if (c) {
        return t ? `[${c}] ${t}` : `[${c}]`;
    }
    return t;
}

export default function CalendarSchedulePage() {
    const user = useAuthStore((s) => s.user);
    const [events, setEvents] = useState<EventInput[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalEditingSeq, setModalEditingSeq] = useState<number | null>(null);
    const [modalInitialDate, setModalInitialDate] = useState<string | null>(null);
    const [modalInitialEndDate, setModalInitialEndDate] = useState<string | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailSeq, setDetailSeq] = useState<number | null>(null);

    const load = useCallback(async (start: Date, endExclusive: Date) => {
        setLoading(true);
        setError(null);
        try {
            const items = await fetchCalendarEvents({
                from: toYmd(start),
                to: exclusiveEndToInclusiveLastDay(endExclusive),
            });
            const ev: EventInput[] = items.map((row) => ({
                id: row.id,
                title: scheduleListTitle(row.categoryName, row.title),
                start: row.start,
                end: row.end,
                allDay: row.allDay,
                backgroundColor: row.backgroundColor,
                extendedProps: {
                    eventKind: row.eventKind,
                    calendarScheduleSeq: row.calendarScheduleSeq,
                    createId: row.createId ?? null,
                },
            }));
            setEvents(ev);
        } catch (e) {
            setEvents([]);
            setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!visibleRange) return;
        void load(visibleRange.start, visibleRange.end);
    }, [visibleRange, load]);

    const onDatesSet = (arg: DatesSetArg) => {
        setVisibleRange({ start: arg.start, end: arg.end });
    };

    const reload = useCallback(() => {
        if (!visibleRange) return;
        void load(visibleRange.start, visibleRange.end);
    }, [visibleRange, load]);

    const openCreate = (startYmd: string | null, endYmd?: string | null) => {
        setModalEditingSeq(null);
        setModalInitialDate(startYmd);
        setModalInitialEndDate(endYmd === undefined ? null : endYmd);
        setModalOpen(true);
    };

    const onEventClick = (info: EventClickArg) => {
        info.jsEvent.preventDefault();
        const seq = parseScheduleSeqFromEventId(info.event.id);
        if (!Number.isFinite(seq)) return;
        const createId = info.event.extendedProps?.createId as string | undefined | null;
        if (isScheduleOwner(user?.username, createId)) {
            setModalEditingSeq(seq);
            setModalInitialDate(null);
            setModalInitialEndDate(null);
            setModalOpen(true);
        } else {
            setDetailSeq(seq);
            setDetailModalOpen(true);
        }
    };

    const onDateClick = (info: DateClickArg) => {
        const d = toYmd(info.date);
        openCreate(d, d);
    };

    const onDateSelect = (arg: DateSelectArg) => {
        const startYmd = toYmd(arg.start);
        const endYmd = exclusiveEndToInclusiveLastDay(arg.end);
        openCreate(startYmd, endYmd);
        arg.view.calendar.unselect();
    };

    const dayCellClassNames = (arg: { date: Date }) => {
        const d = arg.date;
        if (isKoreaPublicHoliday(d)) {
            return ["cal-cell-holiday"];
        }
        const dow = d.getDay();
        if (dow === 0) {
            return ["cal-cell-sun"];
        }
        if (dow === 6) {
            return ["cal-cell-sat"];
        }
        return [];
    };

    const dayCellContent = (arg: DayCellContentArg) => {
        const d = arg.date instanceof Date ? arg.date : new Date(arg.date as unknown as number);
        const names = getKoreaPublicHolidayNames(d);
        const label = names.length ? names.join("·") : null;
        return (
            <div className={styles.dayCellInner}>
                <div className={styles.dayCellTop}>
                    {label ? (
                        <div className={styles.dayCellHoliday}>
                            <span className={styles.holidayMark} aria-hidden />
                            <span className={styles.holidayName} title={label}>
                                {label}
                            </span>
                        </div>
                    ) : (
                        <span className={styles.dayCellHolidaySpacer} />
                    )}
                    <span className={styles.dayNumber}>{arg.dayNumberText}</span>
                </div>
            </div>
        );
    };

    const dayHeaderContent = (arg: DayHeaderContentArg) => {
        const vt = arg.view.type;
        const showHolidayInHeader = vt === "timeGridWeek" || vt === "timeGridDay";
        const names = showHolidayInHeader ? getKoreaPublicHolidayNames(arg.date) : [];
        const label = names.length ? names.join("·") : null;
        return (
            <div className={styles.dayHeaderInner}>
                <span className={styles.dayHeaderText}>{arg.text}</span>
                {label ? (
                    <span className={styles.dayHeaderHoliday} title={label}>
                        {label}
                    </span>
                ) : null}
            </div>
        );
    };

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">일정 달력</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        일정·생일을 등록합니다. 토요일은 파란 배경, 일요일·공휴일은 붉은 배경이며 공휴일 이름이 표시됩니다.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => openCreate(null)}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
                    >
                        일정 등록
                    </button>
                </div>
            </div>

            {loading ? <div className="px-5 py-2 text-sm text-slate-500">불러오는 중…</div> : null}
            {error ? (
                <div className="mx-5 mt-4 rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">{error}</div>
            ) : null}

            <div className={`${styles.wrap} p-3 sm:p-5`}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={koLocale}
                    headerToolbar={{
                        left: "",
                        center: "prev,title,next,today",
                        right: "dayGridMonth,timeGridWeek,timeGridDay",
                    }}
                    buttonText={{
                        today: "오늘",
                        month: "월",
                        week: "주",
                        day: "일",
                    }}
                    selectable
                    selectMirror
                    dateClick={onDateClick}
                    select={onDateSelect}
                    events={events}
                    datesSet={onDatesSet}
                    eventClick={onEventClick}
                    height="auto"
                    fixedWeekCount={false}
                    aspectRatio={1.65}
                    dayMaxEvents={5}
                    moreLinkText={(n) => `+${n}개`}
                    dayCellClassNames={dayCellClassNames}
                    dayCellContent={dayCellContent}
                    dayHeaderContent={dayHeaderContent}
                />
            </div>

            <ScheduleWriteModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setModalEditingSeq(null);
                    setModalInitialDate(null);
                    setModalInitialEndDate(null);
                }}
                onSaved={reload}
                editingSeq={modalEditingSeq}
                initialDate={modalInitialDate}
                initialEndDate={modalInitialEndDate}
            />

            <ScheduleDetailModal
                open={detailModalOpen}
                onClose={() => {
                    setDetailModalOpen(false);
                    setDetailSeq(null);
                }}
                scheduleSeq={detailSeq}
            />
        </div>
    );
}
