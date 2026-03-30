const HOUR_MS = 60 * 60 * 1000;

/**
 * 등록일시가 현재 시각 기준 `hours`시간 이내이면 true (미래 시각이면 false).
 */
export function isCreatedWithinHours(createDt: string | undefined, hours: number): boolean {
    if (!createDt) return false;
    const d = new Date(createDt.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return false;
    const diff = Date.now() - d.getTime();
    return diff >= 0 && diff < hours * HOUR_MS;
}

/** 목록에서 24시간 이내 신규 글 여부 */
export function isNewWithin24Hours(createDt?: string): boolean {
    return isCreatedWithinHours(createDt, 24);
}
