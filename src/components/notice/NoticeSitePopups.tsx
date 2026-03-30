"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isSitePopupDismissedToday, setSitePopupDismissedToday } from "@/lib/sitePopupCookie";
import { isNoticePopupActiveNow } from "@/lib/noticePopupSchedule";
import type { SitePopupListItem } from "@/features/sitePopups/types";

type PopupItem = SitePopupListItem;

function openCenteredWindow(
    url: string,
    width: number,
    height: number,
    posX?: number | null,
    posY?: number | null
): void {
    const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
    const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
    const innerW = window.innerWidth ?? document.documentElement.clientWidth ?? window.screen.width;
    const innerH = window.innerHeight ?? document.documentElement.clientHeight ?? window.screen.height;
    const left =
        posX != null && !Number.isNaN(posX)
            ? dualScreenLeft + posX
            : (innerW - width) / 2 + dualScreenLeft;
    const top =
        posY != null && !Number.isNaN(posY)
            ? dualScreenTop + posY
            : (innerH - height) / 2 + dualScreenTop;
    const feats = `width=${width},height=${height},left=${Math.max(0, Math.floor(left))},top=${Math.max(0, Math.floor(top))},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`;
    window.open(url, `sp_popup_${Date.now()}`, feats);
}

async function fetchSitePopups(): Promise<PopupItem[]> {
    const res = await fetch("/api/site-popups/active", { credentials: "include", cache: "no-store" });
    const json = (await res.json()) as { success?: boolean; data?: PopupItem[] };
    if (!res.ok || !json.success || !json.data) return [];
    return json.data;
}

function NoticeModal({
    item,
    onClose,
    dontShowAgain,
    onDontShowAgainChange,
}: {
    item: PopupItem;
    onClose: () => void;
    dontShowAgain: boolean;
    onDontShowAgainChange: (v: boolean) => void;
}) {
    const w = item.popupWidth ?? 600;
    const h = item.popupHeight ?? 600;
    const maxW = typeof window !== "undefined" ? Math.min(w, window.innerWidth - 32) : w;
    const maxH = typeof window !== "undefined" ? Math.min(h, Math.floor(window.innerHeight * 0.9)) : h;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sp-popup-title"
        >
            <div
                className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-slate-600 bg-[#0c1017] shadow-2xl"
                style={{ maxWidth: maxW, height: maxH }}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-3">
                    <h2 id="sp-popup-title" className="truncate pr-2 text-base font-semibold text-white">
                        {item.title ?? "알림"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                </div>
                <div
                    className="min-h-0 flex-1 overflow-auto px-4 py-3 text-sm text-slate-200 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content ?? "" }}
                />
                <div className="shrink-0 border-t border-slate-700 px-4 py-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={dontShowAgain}
                            onChange={(e) => onDontShowAgainChange(e.target.checked)}
                        />
                        오늘 하루 안 열기
                    </label>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white hover:bg-sky-500"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function NoticeSitePopups() {
    const [modalList, setModalList] = useState<PopupItem[]>([]);
    const [modalIndex, setModalIndex] = useState(0);
    const [dontShow, setDontShow] = useState(false);
    const windowsOpened = useRef(false);

    const currentModal = modalList[modalIndex] ?? null;

    const closeCurrentModal = useCallback(() => {
        if (currentModal?.sitePopupSeq != null && dontShow) {
            setSitePopupDismissedToday(currentModal.sitePopupSeq);
        }
        setDontShow(false);
        setModalIndex((i) => i + 1);
    }, [currentModal, dontShow]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const items = await fetchSitePopups();
                if (cancelled || items.length === 0) return;

                const eligible = items.filter(
                    (x) =>
                        x.sitePopupSeq != null &&
                        isNoticePopupActiveNow({ ...x, popupYn: x.popupYn ?? x.showYn ?? "Y" }) &&
                        !isSitePopupDismissedToday(x.sitePopupSeq)
                );

                const windows = eligible.filter((x) => (x.popupType ?? "MODAL").toUpperCase() === "WINDOW");
                const modals = eligible.filter((x) => (x.popupType ?? "MODAL").toUpperCase() !== "WINDOW");

                if (windows.length > 0 && !windowsOpened.current) {
                    windowsOpened.current = true;
                    windows.forEach((row, i) => {
                        window.setTimeout(() => {
                            if (row.sitePopupSeq == null) return;
                            const url = `${window.location.origin}/site-popup/${row.sitePopupSeq}`;
                            openCenteredWindow(
                                url,
                                row.popupWidth ?? 600,
                                row.popupHeight ?? 600,
                                row.popupPosX,
                                row.popupPosY
                            );
                        }, i * 450);
                    });
                }

                if (modals.length > 0) {
                    setModalList(modals);
                    setModalIndex(0);
                }
            } catch {
                /* ignore */
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (!currentModal) return null;

    return (
        <NoticeModal
            item={currentModal}
            dontShowAgain={dontShow}
            onDontShowAgainChange={setDontShow}
            onClose={closeCurrentModal}
        />
    );
}
