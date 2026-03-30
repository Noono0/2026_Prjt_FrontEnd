"use client";

import { useEffect, useState, use } from "react";
import { setSitePopupDismissedToday } from "@/lib/sitePopupCookie";

type Row = {
    sitePopupSeq?: number;
    title?: string;
    content?: string;
};

export default function SitePopupWindowPage({ params }: { params: Promise<{ sitePopupSeq: string }> }) {
    const { sitePopupSeq: seqStr } = use(params);
    const seq = Number(seqStr);
    const [row, setRow] = useState<Row | null | undefined>(undefined);
    const [dontShow, setDontShow] = useState(false);

    useEffect(() => {
        let cancel = false;
        (async () => {
            try {
                const res = await fetch(`/api/site-popups/public/${seq}`, { cache: "no-store" });
                const json = (await res.json()) as { success?: boolean; data?: Row };
                if (cancel) return;
                if (!res.ok || !json.success || !json.data) {
                    setRow(null);
                    return;
                }
                setRow(json.data);
            } catch {
                if (!cancel) setRow(null);
            }
        })();
        return () => {
            cancel = true;
        };
    }, [seq]);

    const onClose = () => {
        if (!Number.isNaN(seq) && dontShow) {
            setSitePopupDismissedToday(seq);
        }
        window.close();
    };

    if (row === undefined) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0c1017] text-slate-400">
                불러오는 중…
            </div>
        );
    }

    if (row === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0c1017] text-amber-300">
                팝업을 찾을 수 없습니다.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0c1017] text-slate-100">
            <header className="border-b border-slate-800 px-4 py-3">
                <h1 className="text-lg font-semibold text-white">{row.title ?? "팝업"}</h1>
            </header>
            <article
                className="prose prose-invert max-w-none break-words px-4 py-4 text-sm"
                dangerouslySetInnerHTML={{ __html: row.content ?? "" }}
            />
            <footer className="border-t border-slate-800 px-4 py-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
                    오늘 하루 안 열기
                </label>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white hover:bg-sky-500"
                >
                    닫기
                </button>
            </footer>
        </div>
    );
}
