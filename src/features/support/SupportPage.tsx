"use client";

import { ExternalLink, HandHeart, Megaphone, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSiteSupportActive } from "@/features/siteSupport/api";
import type { SiteSupportRow } from "@/features/siteSupport/types";
import { supportCategoryLabel } from "@/features/siteSupport/labels";
import { normalizeSoopEmbedInHtml } from "@/lib/normalizeSoopEmbedInHtml";

const CATEGORY_ORDER = ["AD", "SPONSOR", "HELPER"] as const;

function categoryTone(code: string): { border: string; bg: string; text: string } {
    const c = (code ?? "").toUpperCase();
    if (c === "AD") return { border: "border-amber-600/40", bg: "bg-amber-950/25", text: "text-amber-100" };
    if (c === "SPONSOR") return { border: "border-violet-600/40", bg: "bg-violet-950/25", text: "text-violet-100" };
    return { border: "border-emerald-600/40", bg: "bg-emerald-950/25", text: "text-emerald-100" };
}

function categoryIcon(code: string) {
    const c = (code ?? "").toUpperCase();
    if (c === "AD") return <Megaphone size={16} />;
    if (c === "SPONSOR") return <Sparkles size={16} />;
    return <HandHeart size={16} />;
}

export default function SupportPage() {
    const [items, setItems] = useState<SiteSupportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const rows = await fetchSiteSupportActive();
            setItems(rows ?? []);
        } catch (e) {
            setItems([]);
            setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const byCategory = useMemo(() => {
        const map = new Map<string, SiteSupportRow[]>();
        for (const cat of CATEGORY_ORDER) {
            map.set(cat, []);
        }
        for (const row of items) {
            const c = (row.categoryCode ?? "HELPER").toUpperCase();
            const key = CATEGORY_ORDER.includes(c as (typeof CATEGORY_ORDER)[number]) ? c : "HELPER";
            map.get(key)!.push(row);
        }
        for (const list of map.values()) {
            list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (b.supportSeq ?? 0) - (a.supportSeq ?? 0));
        }
        return map;
    }, [items]);

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] p-6 text-slate-100 shadow-xl">
            <div className="mb-6 border-b border-slate-800 pb-4">
                <h1 className="text-2xl font-bold text-white">서포트</h1>
                <p className="mt-1 text-sm text-slate-400">
                    광고 · 협찬 · 함께해 주신 분들을 소개합니다. (관리자에서 등록한 항목만 표시됩니다.)
                </p>
            </div>

            {error ? (
                <div className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="py-16 text-center text-slate-500">불러오는 중…</div>
            ) : items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-12 text-center text-sm text-slate-500">
                    아직 노출 중인 서포트 항목이 없습니다.
                </div>
            ) : (
                <div className="space-y-10">
                    {CATEGORY_ORDER.map((cat) => {
                        const rows = byCategory.get(cat) ?? [];
                        if (rows.length === 0) return null;
                        const tone = categoryTone(cat);
                        return (
                            <section key={cat}>
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                                    <span
                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${tone.border} ${tone.bg} ${tone.text}`}
                                    >
                                        {categoryIcon(cat)}
                                    </span>
                                    {supportCategoryLabel(cat)}
                                    <span className="text-sm font-normal text-slate-500">({rows.length})</span>
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {rows.map((row) => {
                                        const tc = categoryTone(cat);
                                        return (
                                            <article
                                                key={row.supportSeq}
                                                className={`flex h-full flex-col rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 ${tc.border} ${tc.bg} ${tc.text}`}
                                            >
                                                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                                                    <span
                                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/30 ${tc.text}`}
                                                    >
                                                        {categoryIcon(cat)}
                                                    </span>
                                                    <span className="line-clamp-2">{row.title ?? "(제목 없음)"}</span>
                                                </div>
                                                <div
                                                    className="board-detail-content prose prose-invert prose-sm max-w-none flex-1 break-words text-slate-200"
                                                    dangerouslySetInnerHTML={{
                                                        __html: normalizeSoopEmbedInHtml(row.content ?? ""),
                                                    }}
                                                />
                                                {row.linkUrl ? (
                                                    <div className="mt-4 border-t border-white/10 pt-3">
                                                        <a
                                                            href={row.linkUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 hover:text-sky-200"
                                                        >
                                                            바로가기
                                                            <ExternalLink
                                                                size={14}
                                                                className="opacity-80"
                                                                aria-hidden
                                                            />
                                                        </a>
                                                    </div>
                                                ) : null}
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
