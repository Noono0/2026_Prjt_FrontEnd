/** API/DB: yyyy-MM-dd HH:mm:ss */
function parseApiDateTime(s: string): number | null {
    const t = new Date(s.replace(" ", "T"));
    return Number.isNaN(t.getTime()) ? null : t.getTime();
}

export type PopupScheduleRow = {
    popupYn?: string;
    showYn?: string;
    popupStartDt?: string | null;
    popupEndDt?: string | null;
};

/**
 * 팝업 사용(Y)이고, 설정한 시작·종료 시각 안에 있을 때(둘 다 비우면 항상 해당).
 */
export function isNoticePopupActiveNow(row: PopupScheduleRow): boolean {
    const on = (row.popupYn ?? row.showYn ?? "N").toUpperCase() === "Y";
    if (!on) return false;
    const now = Date.now();
    if (row.popupStartDt?.trim()) {
        const st = parseApiDateTime(row.popupStartDt.trim());
        if (st != null && now < st) return false;
    }
    if (row.popupEndDt?.trim()) {
        const et = parseApiDateTime(row.popupEndDt.trim());
        if (et != null && now > et) return false;
    }
    return true;
}

export function apiDateTimeToDatetimeLocal(api?: string | null): string {
    if (!api?.trim()) return "";
    return api.trim().replace(" ", "T").slice(0, 16);
}

/** 상세·목록용: 노출 기간 한 줄 (API yyyy-MM-dd HH:mm:ss 그대로 또는 안내 문구) */
export function formatPopupPeriodRange(start?: string | null, end?: string | null): string {
    if (!start?.trim() && !end?.trim()) {
        return "항상 (시작·종료 미설정)";
    }
    const left = start?.trim() ? start.trim() : "즉시";
    const right = end?.trim() ? end.trim() : "제한 없음";
    return `${left} ~ ${right}`;
}

/** datetime-local 값 → DB 저장용 yyyy-MM-dd HH:mm:ss */
export function datetimeLocalToApiDateTime(local: string): string | null {
    const t = local?.trim();
    if (!t) return null;
    if (t.length === 16) return `${t.replace("T", " ")}:00`;
    if (t.includes("T") && t.length > 16) return t.replace("T", " ").slice(0, 19);
    return t;
}
