export type CalendarEventView = {
    id: string;
    calendarScheduleSeq: number;
    /** DB 제목(접두 없음) */
    title: string;
    /** A0003 코드명 — 있으면 목록/달력에 `[이름] 제목`으로 표시 */
    categoryName?: string | null;
    start: string;
    end: string;
    allDay: boolean;
    eventKind: string;
    backgroundColor?: string;
    /** 등록자 회원 ID */
    createId?: string | null;
};

export type ScheduleCategoryOption = {
    value: string;
    label: string;
};

export type CalendarScheduleDetail = {
    calendarScheduleSeq?: number;
    eventKind?: string;
    title?: string;
    categoryCode?: string | null;
    /** 달력 막대 색 #RGB / #RRGGBB */
    eventColor?: string | null;
    categoryName?: string | null;
    content?: string;
    startDate?: string;
    endDate?: string;
    /** HH:mm (optional) */
    startTime?: string;
    endTime?: string;
    birthMonth?: number;
    birthDay?: number;
    createId?: string | null;
    createDt?: string;
    modifyDt?: string;
};

export type CalendarRangeRequest = {
    from: string;
    to: string;
};

export type CalendarScheduleSaveBody = {
    calendarScheduleSeq?: number;
    eventKind: string;
    title: string;
    /** 공통코드 A0003 code_value — 없으면 null */
    categoryCode?: string | null;
    /** 달력 색 (#RRGGBB 등). 생략 시 신규는 랜덤, 수정은 기존값 유지 */
    eventColor?: string | null;
    content?: string;
    startDate?: string;
    endDate?: string;
    /** 비우면 null로 보내 수정 시 DB에서도 제거 */
    startTime?: string | null;
    endTime?: string | null;
    birthMonth?: number;
    birthDay?: number;
};
