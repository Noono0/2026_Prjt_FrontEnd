/** 달력 일정 표시용 (어두운 배경에서도 구분 가능한 채도) */
export const SCHEDULE_COLOR_PALETTE = [
    "#0ea5e9",
    "#8b5cf6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#14b8a6",
    "#6366f1",
    "#84cc16",
    "#d946ef",
] as const;

export function pickRandomScheduleColor(): string {
    const i = Math.floor(Math.random() * SCHEDULE_COLOR_PALETTE.length);
    return SCHEDULE_COLOR_PALETTE[i] ?? "#0ea5e9";
}
