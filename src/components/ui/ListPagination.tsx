"use client";

import React, { useCallback, useMemo, useState } from "react";

type ListPaginationProps = {
    page: number;
    size: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
    className?: string;
};

function buildPageItems(
    current: number,
    totalPages: number,
    siblingCount: number
): Array<number | "ellipsis"> {
    if (totalPages <= 1) return [1];
    if (totalPages <= 11) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const items: Array<number | "ellipsis"> = [];
    const left = Math.max(2, current - siblingCount);
    const right = Math.min(totalPages - 1, current + siblingCount);

    items.push(1);
    if (left > 2) items.push("ellipsis");
    for (let p = left; p <= right; p += 1) items.push(p);
    if (right < totalPages - 1) items.push("ellipsis");
    items.push(totalPages);

    return items;
}

export default function ListPagination({
    page,
    size,
    totalCount,
    onPageChange,
    siblingCount = 1,
    className = "",
}: ListPaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, size)));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const [jump, setJump] = useState("");

    const items = useMemo(
        () => buildPageItems(safePage, totalPages, siblingCount),
        [safePage, siblingCount, totalPages]
    );

    const go = useCallback(
        (p: number) => {
            const next = Math.min(Math.max(1, p), totalPages);
            if (next !== page) onPageChange(next);
        },
        [onPageChange, page, totalPages]
    );

    const onJumpSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            const n = parseInt(jump, 10);
            if (Number.isFinite(n)) go(n);
            setJump("");
        },
        [go, jump]
    );

    return (
        <div className={`flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6 ${className}`}>
            <div className="flex items-center gap-1 text-sm">
                <button
                    type="button"
                    aria-label="이전 페이지"
                    disabled={safePage <= 1}
                    onClick={() => go(safePage - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                >
                    ‹
                </button>

                <div className="flex flex-wrap items-center justify-center gap-1 px-1">
                    {items.map((item, idx) =>
                        item === "ellipsis" ? (
                            <span key={`e-${idx}`} className="px-2 text-slate-500">
                                …
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                onClick={() => go(item)}
                                className={`min-w-[2.25rem] rounded px-2 py-1.5 text-center transition ${
                                    item === safePage
                                        ? "bg-sky-600 font-semibold text-white"
                                        : "text-slate-300 hover:bg-slate-800"
                                }`}
                            >
                                {item}
                            </button>
                        )
                    )}
                </div>

                <button
                    type="button"
                    aria-label="다음 페이지"
                    disabled={safePage >= totalPages}
                    onClick={() => go(safePage + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                >
                    ›
                </button>
            </div>

            <form onSubmit={onJumpSubmit} className="flex items-center gap-2 text-sm text-slate-400">
                <span className="whitespace-nowrap">페이지</span>
                <input
                    value={jump}
                    onChange={(e) => setJump(e.target.value)}
                    placeholder={`1–${totalPages}`}
                    className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-center text-slate-100 outline-none focus:border-sky-600"
                    inputMode="numeric"
                />
                <button
                    type="submit"
                    className="rounded border border-slate-600 px-2 py-1.5 text-slate-200 hover:bg-slate-800"
                    aria-label="페이지 이동"
                >
                    ↵
                </button>
            </form>
        </div>
    );
}

