/** site_popup_seq 기준 오늘 하루 닫기 */

export function sitePopupDismissCookieName(sitePopupSeq: number): string {
    return `sp_popup_dismiss_${sitePopupSeq}`;
}

export function setSitePopupDismissedToday(sitePopupSeq: number): void {
    if (typeof document === "undefined") return;
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const name = sitePopupDismissCookieName(sitePopupSeq);
    document.cookie = `${name}=1; path=/; expires=${end.toUTCString()}; SameSite=Lax`;
}

export function isSitePopupDismissedToday(sitePopupSeq: number): boolean {
    if (typeof document === "undefined") return false;
    const prefix = `${sitePopupDismissCookieName(sitePopupSeq)}=`;
    return document.cookie.split(";").some((c) => c.trim().startsWith(prefix));
}
