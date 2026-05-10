"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ListPagination from "@/components/ui/ListPagination";
import { searchSiteSupportRows } from "./api";
import type { SiteSupportRow, SiteSupportSearchCondition } from "./types";
import { SUPPORT_CATEGORY_OPTIONS, supportCategoryLabel } from "./labels";

function formatListDate(createDt?: string): string {
    if (!createDt) return "-";
    const d = new Date(createDt.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return createDt.slice(0, 10).replace(/-/g, ".");
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function shortUrl(u: string | null | undefined): string {
    if (!u) return "-";
    const t = u.trim();
    if (t.length <= 48) return t;
    return `${t.slice(0, 46)}…`;
}

export default function SiteSupportItemsPage() {
    const [keyword, setKeyword] = useState("");
    const [appliedKeyword, setAppliedKeyword] = useState("");
    const [categoryCode, setCategoryCode] = useState("");
    const [appliedCategory, setAppliedCategory] = useState("");
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [items, setItems] = useState<SiteSupportRow[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const requestBody = useMemo((): SiteSupportSearchCondition => {
        const body: SiteSupportSearchCondition = {
            page,
            size,
            sortBy: "supportSeq",
            sortDir: "desc",
        };
        const q = appliedKeyword.trim();
        if (q) body.keyword = q;
        const cat = appliedCategory.trim();
        if (cat) body.categoryCode = cat;
        return body;
    }, [appliedCategory, appliedKeyword, page, size]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await searchSiteSupportRows(requestBody);
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

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setAppliedKeyword(keyword);
        setAppliedCategory(categoryCode);
    };

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">서포트 콘텐츠</h1>
                    <p className="mt-1 text-sm text-slate-500">광고 · 협찬 · 도움 주신 분들 카드를 관리합니다.</p>
                </div>
                <Link
                    href="/admin/support-items/write"
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
                >
                    등록
                </Link>
            </div>

            <div className="border-b border-slate-800 px-5 py-4">
                <form onSubmit={onSearch} className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[140px]">
                        <div className="mb-1 text-xs font-medium text-slate-500">분류</div>
                        <select
                            value={categoryCode}
                            onChange={(e) => setCategoryCode(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                        >
                            <option value="">전체</option>
                            {SUPPORT_CATEGORY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[200px] flex-1">
                        <div className="mb-1 text-xs font-medium text-slate-500">검색</div>
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="제목·내용"
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                        />
                    </div>
                    <button
                        type="submit"
                        className="h-10 rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm text-slate-100 hover:bg-slate-700"
                    >
                        조회
                    </button>
                </form>
            </div>

            <div className="overflow-x-auto px-2 py-4 sm:px-5">
                {error ? (
                    <div className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                        {error}
                    </div>
                ) : null}
                {loading ? (
                    <div className="py-16 text-center text-slate-500">불러오는 중…</div>
                ) : (
                    <>
                        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
                                    <th className="px-3 py-2 font-medium">번호</th>
                                    <th className="px-3 py-2 font-medium">분류</th>
                                    <th className="px-3 py-2 font-medium">제목</th>
                                    <th className="px-3 py-2 font-medium">바로가기</th>
                                    <th className="px-3 py-2 font-medium">노출</th>
                                    <th className="px-3 py-2 font-medium">정렬</th>
                                    <th className="px-3 py-2 font-medium">등록일</th>
                                    <th className="px-3 py-2 font-medium">등록자</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                                            등록된 항목이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((row) => (
                                        <tr
                                            key={row.supportSeq}
                                            className="border-b border-slate-800/80 hover:bg-slate-900/60"
                                        >
                                            <td className="px-3 py-3 text-slate-400">{row.supportSeq}</td>
                                            <td className="px-3 py-3 text-slate-300">
                                                {supportCategoryLabel(row.categoryCode)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <Link
                                                    href={`/admin/support-items/${row.supportSeq}`}
                                                    className="font-medium text-slate-100 hover:text-sky-400"
                                                >
                                                    {row.title ?? "(제목 없음)"}
                                                </Link>
                                            </td>
                                            <td
                                                className="max-w-[200px] truncate px-3 py-3 text-xs text-slate-500"
                                                title={row.linkUrl ?? ""}
                                            >
                                                {shortUrl(row.linkUrl)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span
                                                    className={
                                                        row.showYn === "Y" ? "text-emerald-400" : "text-slate-500"
                                                    }
                                                >
                                                    {row.showYn === "Y" ? "Y" : "N"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-slate-400">{row.sortOrder ?? 0}</td>
                                            <td className="px-3 py-3 text-slate-400">{formatListDate(row.createDt)}</td>
                                            <td className="px-3 py-3 text-slate-400">{row.createId ?? "-"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="mt-6 flex justify-center">
                            <ListPagination page={page} totalCount={totalCount} size={size} onPageChange={setPage} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
