type Props = {
    status?: string | null;
    className?: string;
    /** SETTLED 표기 — 목록: 종료됨, 상세 헤더: 종료 */
    settledText?: string;
    /** false면 status 없을 때 아무 것도 렌더하지 않음 (상세 헤더 등) */
    showPlaceholder?: boolean;
};

const base = "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
const openCls = `${base} bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/35`;
const settledCls = `${base} bg-slate-600/40 text-slate-200 ring-1 ring-slate-500/50`;
const cancelledCls = `${base} bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35`;
const unknownCls = `${base} bg-slate-700/50 font-medium text-slate-400`;

export function EventBattleStatusBadge({
    status,
    className = "",
    settledText = "종료됨",
    showPlaceholder = true,
}: Props) {
    const suffix = className ? ` ${className}` : "";
    const s = status?.trim();

    if (!s) {
        if (!showPlaceholder) return null;
        return <span className={`text-xs text-slate-400${suffix}`}>-</span>;
    }

    if (s === "OPEN") {
        return <span className={`${openCls}${suffix}`}>진행중</span>;
    }
    if (s === "SETTLED") {
        return <span className={`${settledCls}${suffix}`}>{settledText}</span>;
    }
    if (s === "CANCELLED") {
        return <span className={`${cancelledCls}${suffix}`}>취소</span>;
    }
    return <span className={`${unknownCls}${suffix}`}>{s}</span>;
}
