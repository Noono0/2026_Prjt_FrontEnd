"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ListPagination from "@/components/ui/ListPagination";
import { searchBoards } from "./api";
import type { BoardListItem, BoardSearchCondition } from "./types";

// TODO: 공통코드 연동 시 여기만 교체하면 됨.
const CATEGORIES: { label: string; code: string | null }[] = [
    { label: "전체", code: null },
    { label: "잡담", code: "CHAT" },
    { label: "주식/코인", code: "STOCK" },
    { label: "정보", code: "INFO" },
];

type SearchField = "title" | "all";

function formatListDate(createDt?: string): string {
    if (!createDt) return "-";
    const d = new Date(createDt.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return createDt.slice(0, 10).replace(/-/g, ".");

    const now = new Date();
    const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();

    if (sameDay) {
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function PencilIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-200">
            <path
                d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4L16.5 3.5z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function HomeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-400">
            <path
                d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-10.5z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function BoardsPage() {
    const [categoryCode, setCategoryCode] = useState<string | null>(null);
    const [searchField, setSearchField] = useState<SearchField>("all");
    const [searchText, setSearchText] = useState("");
    const [appliedSearch, setAppliedSearch] = useState({ field: "all" as SearchField, text: "" });
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [noticeExpanded, setNoticeExpanded] = useState(false);

    const [items, setItems] = useState<BoardListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const requestBody = useMemo((): BoardSearchCondition => {
        const body: BoardSearchCondition = {
            page,
            size,
            sortBy: "boardSeq",
            sortDir: "desc",
            showYn: "Y",
        };
        if (categoryCode) body.categoryCode = categoryCode;

        const q = appliedSearch.text.trim();
        if (q) {
            if (appliedSearch.field === "title") body.title = q;
            else body.keyword = q;
        }
        return body;
    }, [appliedSearch.field, appliedSearch.text, categoryCode, page, size]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await searchBoards(requestBody);
            setItems(res.items ?? []);
            setTotalCount(res.totalCount ?? 0);
        } catch (e) {
            setItems([]);
            setTotalCount(0);
            setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [requestBody]);

    useEffect(() => {
        void load();
    }, [load]);

    const pinned = useMemo(() => items.filter((r) => r.highlightYn === "Y"), [items]);
    const normal = useMemo(() => items.filter((r) => r.highlightYn !== "Y"), [items]);
    const visiblePinned = noticeExpanded ? pinned : pinned.slice(0, 2);
    const displayRows = [...visiblePinned, ...normal];

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setAppliedSearch({ field: searchField, text: searchText });
    };

    const onCategoryClick = (code: string | null) => {
        setCategoryCode(code);
        setPage(1);
    };

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <h1 className="text-xl font-bold tracking-tight text-white">자유게시판</h1>
                <Link
                    href="/boards/write"
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                >
                    <PencilIcon />
                    글쓰기
                </Link>
            </div>

            <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900"
                        aria-label="홈"
                    >
                        <HomeIcon />
                    </button>

                    {CATEGORIES.map((c) => (
                        <button
                            key={c.label}
                            type="button"
                            onClick={() => onCategoryClick(c.code)}
                            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                                categoryCode === c.code
                                    ? "bg-sky-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
                    <select
                        value={searchField}
                        onChange={(e) => setSearchField(e.target.value as SearchField)}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200 outline-none focus:border-sky-600"
                    >
                        <option value="title">제목</option>
                        <option value="all">제목+내용</option>
                    </select>

                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="검색어를 입력하세요"
                        className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-600"
                    />

                    <button
                        type="submit"
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                    >
                        검색
                    </button>

                    <div className="ml-1 flex rounded-lg border border-slate-700 p-0.5">
                        <button
                            type="button"
                            aria-label="목록 보기"
                            onClick={() => setViewMode("list")}
                            className={`rounded px-2 py-1.5 ${
                                viewMode === "list" ? "bg-slate-600 text-white" : "text-slate-500"
                            }`}
                        >
                            ☰
                        </button>
                        <button
                            type="button"
                            aria-label="격자 보기"
                            onClick={() => setViewMode("grid")}
                            className={`rounded px-2 py-1.5 ${
                                viewMode === "grid" ? "bg-slate-600 text-white" : "text-slate-500"
                            }`}
                        >
                            ⊞
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="mx-5 mt-4 rounded-lg border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                    {error}
                </div>
            )}

            {pinned.length > 2 && (
                <div className="px-5 pt-3">
                    <button
                        type="button"
                        onClick={() => setNoticeExpanded((v) => !v)}
                        className="text-sm text-sky-400 hover:text-sky-300"
                    >
                        {noticeExpanded ? "공지 접기" : "공지 더보기"}
                    </button>
                </div>
            )}

            {loading ? (
                <div className="px-5 py-16 text-center text-slate-500">불러오는 중…</div>
            ) : viewMode === "list" ? (
                <div className="overflow-x-auto px-2 pb-6 sm:px-5">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-500">
                                <th className="w-[120px] px-3 py-3 font-medium">구분</th>
                                <th className="px-3 py-3 font-medium">제목</th>
                                <th className="w-[140px] px-3 py-3 font-medium">작성자</th>
                                <th className="w-[100px] px-3 py-3 font-medium">작성일</th>
                                <th className="w-[72px] px-3 py-3 font-medium text-right">조회</th>
                                <th className="w-[72px] px-3 py-3 font-medium text-right">추천</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-12 text-center text-slate-500">
                                        등록된 글이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                displayRows.map((row) => {
                                    const isNotice = row.highlightYn === "Y";
                                    const cc = row.commentCount ?? 0;
                                    const likes = row.likeCount ?? 0;
                                    return (
                                        <tr
                                            key={row.boardSeq}
                                            className="border-b border-slate-800/80 hover:bg-slate-900/60"
                                        >
                                            <td className="px-3 py-3 align-top">
                                                {isNotice ? (
                                                    <span className="inline-block rounded bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                                                        공지
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        {row.categoryName ?? row.categoryCode ?? "-"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="cursor-default text-slate-100 hover:text-sky-400">
                                                        {row.title ?? "(제목 없음)"}
                                                    </span>
                                                    {cc > 0 && <span className="text-xs text-sky-400">[{cc}]</span>}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-300">
                                                        {(row.writerName ?? "?").slice(0, 1)}
                                                    </span>
                                                    <span className="truncate text-slate-300">{row.writerName ?? "-"}</span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-slate-400">
                                                {formatListDate(row.createDt)}
                                            </td>
                                            <td className="px-3 py-3 text-right tabular-nums text-slate-400">
                                                {row.viewCount ?? 0}
                                            </td>
                                            <td className="px-3 py-3 text-right font-medium tabular-nums text-sky-400">
                                                {likes}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid gap-4 px-5 pb-6 sm:grid-cols-2 lg:grid-cols-3">
                    {displayRows.length === 0 ? (
                        <p className="col-span-full py-12 text-center text-slate-500">등록된 글이 없습니다.</p>
                    ) : (
                        displayRows.map((row) => (
                            <article
                                key={row.boardSeq}
                                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
                            >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    {row.highlightYn === "Y" ? (
                                        <span className="rounded bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                                            공지
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-500">
                                            {row.categoryName ?? row.categoryCode}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-500">{formatListDate(row.createDt)}</span>
                                </div>
                                <h2 className="line-clamp-2 font-medium text-slate-100">{row.title}</h2>
                                <div className="mt-3 flex justify-between text-xs text-slate-500">
                                    <span>{row.writerName}</span>
                                    <span>
                                        조회 {row.viewCount ?? 0} · 추천{" "}
                                        <span className="text-sky-400">{row.likeCount ?? 0}</span>
                                    </span>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            )}

            <div className="border-t border-slate-800 px-5 py-6">
                <ListPagination page={page} size={size} totalCount={totalCount} onPageChange={setPage} siblingCount={1} />
            </div>
        </div>
    );
}

