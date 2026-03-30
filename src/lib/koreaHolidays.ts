import Holidays from "date-holidays";

const hd = new Holidays("KR");

function toLocalDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** 대한민국 법정 공휴일(라이브러리 데이터 기준) */
export function isKoreaPublicHoliday(date: Date): boolean {
    const r = hd.isHoliday(toLocalDay(date));
    if (r === false) return false;
    return Array.isArray(r) && r.length > 0;
}

/** 같은 날 여러 공휴일이 겹치면 이름을 모두 반환 (예: 설날 연휴) */
export function getKoreaPublicHolidayNames(date: Date): string[] {
    const r = hd.isHoliday(toLocalDay(date));
    if (r === false || !Array.isArray(r) || r.length === 0) {
        return [];
    }
    const names = r.map((h) => (typeof h.name === "string" ? h.name.trim() : "")).filter(Boolean);
    return [...new Set(names)];
}
