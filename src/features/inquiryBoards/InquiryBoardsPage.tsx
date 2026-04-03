"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ListPagination from "@/components/ui/ListPagination";
import type { BoardListItem } from "@/features/boards/types";
import type { BoardCategoryOption } from "@/features/boards/types";
import { fetchInquiryCategories, searchInquiryBoards } from "./api";
import { isNewWithin24Hours } from "@/lib/listDateUtils";

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

export default function InquiryBoardsPage() {
    const [items, setItems] = useState<BoardListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [categories, setCategories] = useState<BoardCategoryOption[]>([]);
    const [categoryCode, setCategoryCode] = useState<string | null>(null);
    const [searchField, setSearchField] = useState<SearchField>("all");
    const [searchText, setSearchText] = useState("");
    const [appliedSearch, setAppliedSearch] = useState<{ field: SearchField; text: string }>({
        field: "all",
        text: "",
    });
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const categoryButtons = useMemo(
        () => [{ value: "", label: "전체" }, ...categories.map((c) => ({ value: c.value, label: c.label }))],
        [categories]
    );

    useEffect(() => {
        void (async () => {
            setLoading(true);
            try {
                const res = await searchInquiryBoards({
                    page,
                    size,
                    sortBy: "boardSeq",
                    sortDir: "desc",
                    showYn: "Y",
                    ...(categoryCode ? { categoryCode } : {}),
                    ...(appliedSearch.text.trim()
                        ? appliedSearch.field === "title"
                            ? { title: appliedSearch.text.trim() }
                            : { keyword: appliedSearch.text.trim() }
                        : {}),
                });
                setItems(res.items ?? []);
                setTotalCount(res.totalCount ?? 0);
                setError(null);
            } catch (e) {
                setError(e instanceof Error ? e.message : "목록 조회 실패");
                setItems([]);
                setTotalCount(0);
            } finally {
                setLoading(false);
            }
        })();
    }, [categoryCode, appliedSearch, page, size]);

    useEffect(() => {
        void (async () => {
            try {
                setCategories(await fetchInquiryCategories());
            } catch {
                setCategories([]);
            }
        })();
    }, []);

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <h1 className="text-xl font-bold tracking-tight text-white">문의게시판</h1>
                <Link href="/inquiry-boards/write" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">
                    글쓰기
                </Link>
            </div>
            <form
                className="flex flex-col gap-3 border-b border-slate-800 px-5 py-3 lg:flex-row lg:items-center lg:justify-between"
                onSubmit={(e) => {
                    e.preventDefault();
                    setPage(1);
                    setAppliedSearch({ field: searchField, text: searchText });
                }}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900"
                        aria-label="홈"
                    >
                        <HomeIcon />
                    </button>
                    {categoryButtons.map((c) => {
                        const value = c.value === "" ? null : c.value;
                        return (
                            <button
                                key={`${c.label}-${c.value || "all"}`}
                                type="button"
                                onClick={() => {
                                    setCategoryCode(value);
                                    setPage(1);
                                }}
                                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                                    categoryCode === value
                                        ? "border-sky-400 bg-sky-600 text-white"
                                        : "border-slate-600 bg-slate-900/80 text-slate-400 hover:border-slate-500 hover:bg-slate-800 hover:text-slate-200"
                                }`}
                            >
                                {c.label}
                            </button>
                        );
                    })}
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                        className="min-w-[220px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-600"
                    />
                    <button
                        type="submit"
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                    >
                        검색
                    </button>
                </div>
            </form>
            {loading ? <div className="p-6 text-slate-400">불러오는 중...</div> : null}
            {error ? <div className="p-6 text-amber-300">{error}</div> : null}
            {!loading && !error ? (
                <div className="overflow-x-auto px-2 pb-6 sm:px-5">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-500">
                                <th className="w-[120px] px-3 py-3 font-medium">구분</th>
                                <th className="px-3 py-3 font-medium">제목</th>
                                <th className="w-[160px] px-3 py-3 font-medium">작성자</th>
                                <th className="w-[100px] px-3 py-3 font-medium">작성일</th>
                                <th className="w-[72px] px-3 py-3 text-right font-medium">조회</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-12 text-center text-slate-500">
                                        등록된 글이 없습니다.
                                    </td>
                                </tr>
                            ) : null}
                            {items.map((row) => (
                                <tr key={row.boardSeq} className="border-b border-slate-800/80 hover:bg-slate-900/60">
                                    <td className="px-3 py-3 text-slate-400">{row.categoryName ?? row.categoryCode ?? "-"}</td>
                                    <td className="px-3 py-3">
                                        <Link href={`/inquiry-boards/${row.boardSeq}`} className="text-slate-100 hover:text-sky-400">
                                            {row.secretYn === "Y" ? "🔒 " : ""}
                                            {row.title}
                                            {isNewWithin24Hours(row.createDt) ? (
                                                <span className="ml-2 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                                    NEW
                                                </span>
                                            ) : null}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-3">{row.writerName ?? "-"}</td>
                                    <td className="px-3 py-3 text-slate-400">{formatListDate(row.createDt)}</td>
                                    <td className="px-3 py-3 text-right text-slate-400">{row.viewCount ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
            <div className="border-t border-slate-800 px-5 py-6">
                <ListPagination page={page} size={size} totalCount={totalCount} onPageChange={setPage} siblingCount={1} />
            </div>
        </div>
    );
}

