"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ListPagination from "@/components/ui/ListPagination";
import { fetchNoticeBoardCategories, searchNoticeBoards } from "./api";
import type { NoticeBoardCategoryOption, NoticeBoardListItem, NoticeBoardSearchCondition } from "./types";
import { useAuthStore } from "@/stores/authStore";
import styles from "./NoticeBoardsPage.module.css";
import { postHtmlContainsImage } from "@/lib/postHtmlHasImage";
import { isNewWithin24Hours } from "@/lib/listDateUtils";

type SearchField = "title" | "all";

const PINNED_PREVIEW_COUNT = 5;

function isNoticePinOnFreeBoard(row: NoticeBoardListItem): boolean {
    return row.pinOnFreeBoardYn === "Y";
}

function ImageAttachIcon() {
    return (
        <span className={styles.attachIcon} title="이미지 포함" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M8 14l2.5-2.5a1 1 0 011.4 0L15 14" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
            </svg>
        </span>
    );
}

function formatListDate(createDt?: string): string {
    if (!createDt) return "-";
    const d = new Date(createDt.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return createDt.slice(0, 10).replace(/-/g, ".");
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function NoticeBoardsPage() {
    const { user } = useAuthStore();
    const [categoryCode, setCategoryCode] = useState<string | null>(null);
    const [searchField, setSearchField] = useState<SearchField>("all");
    const [searchText, setSearchText] = useState("");
    const [appliedSearch, setAppliedSearch] = useState({ field: "all" as SearchField, text: "" });
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [categories, setCategories] = useState<NoticeBoardCategoryOption[]>([]);
    const [items, setItems] = useState<NoticeBoardListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [freeBoardPinExpanded, setFreeBoardPinExpanded] = useState(false);

    const requestBody = useMemo((): NoticeBoardSearchCondition => {
        const body: NoticeBoardSearchCondition = {
            page,
            size,
            sortBy: "noticeBoardSeq",
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
            const res = await searchNoticeBoards(requestBody);
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

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setCategories(await fetchNoticeBoardCategories());
            } catch {
                setCategories([]);
            }
        };
        void loadCategories();
    }, []);

    const { pinnedOnFreeBoard, otherNotices } = useMemo(() => {
        const pinned = items.filter(isNoticePinOnFreeBoard);
        const rest = items.filter((r) => !isNoticePinOnFreeBoard(r));
        return { pinnedOnFreeBoard: pinned, otherNotices: rest };
    }, [items]);

    const visiblePinnedNotices = freeBoardPinExpanded
        ? pinnedOnFreeBoard
        : pinnedOnFreeBoard.slice(0, PINNED_PREVIEW_COUNT);
    const showFreeBoardPinToggle = pinnedOnFreeBoard.length > PINNED_PREVIEW_COUNT;

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setAppliedSearch({ field: searchField, text: searchText });
    };

    const getDetailHref = (row: NoticeBoardListItem) => {
        const isMine =
            typeof user?.memberSeq === "number" &&
            typeof row.writerMemberSeq === "number" &&
            user.memberSeq === row.writerMemberSeq;
        return isMine ? `/notice-board/${row.noticeBoardSeq}?mode=edit` : `/notice-board/${row.noticeBoardSeq}`;
    };

    const renderRow = (row: NoticeBoardListItem) => {
        const hasImage = postHtmlContainsImage(row.content);
        const cc = row.commentCount ?? 0;
        const pinHi = isNoticePinOnFreeBoard(row);
        return (
            <tr
                key={row.noticeBoardSeq}
                className={`border-b border-slate-800/80 hover:bg-slate-900/60 ${pinHi ? styles.rowPinHighlight : ""}`}
            >
                <td className="px-3 py-3 align-top">
                    {pinHi ? (
                        <span className="inline-block rounded bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                            공지사항
                        </span>
                    ) : (
                        <span className="text-slate-400">{row.categoryName ?? row.categoryCode ?? "-"}</span>
                    )}
                </td>
                <td className="px-3 py-3">
                    <Link href={getDetailHref(row)} className="text-slate-100 hover:text-sky-400">
                        <div className={styles.titleRow}>
                            <span>{row.title ?? "(제목 없음)"}</span>
                            {hasImage && <ImageAttachIcon />}
                            {cc > 0 && <span className={styles.commentCount}>[{cc}]</span>}
                            {isNewWithin24Hours(row.createDt) ? (
                                <span
                                    className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                                    aria-label="24시간 이내 등록"
                                >
                                    NEW
                                </span>
                            ) : null}
                        </div>
                    </Link>
                </td>
                <td className="px-3 py-3">
                    <div className={styles.authorCell}>
                        {row.writerProfileImageUrl ? (
                            <img src={row.writerProfileImageUrl} alt="작성자 프로필" className={styles.authorAvatar} />
                        ) : (
                            <span className={styles.authorFallback}>{(row.writerName ?? "?").slice(0, 1)}</span>
                        )}
                        <span className={styles.authorName}>{row.writerName ?? "-"}</span>
                    </div>
                </td>
                <td className="px-3 py-3 text-slate-400">{formatListDate(row.createDt)}</td>
                <td className="px-3 py-3 text-right text-slate-400">{row.viewCount ?? 0}</td>
            </tr>
        );
    };

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <h1 className="text-xl font-bold tracking-tight text-white">공지사항</h1>
                <Link
                    href="/notice-board/write"
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
                >
                    글쓰기
                </Link>
            </div>

            <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCategoryCode(null)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium ${categoryCode === null ? "bg-sky-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}
                    >
                        전체
                    </button>
                    {categories.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setCategoryCode(c.value)}
                            className={`rounded-full px-3 py-1.5 text-sm font-medium ${categoryCode === c.value ? "bg-sky-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
                    <select
                        value={searchField}
                        onChange={(e) => setSearchField(e.target.value as SearchField)}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200"
                    >
                        <option value="title">제목</option>
                        <option value="all">제목+내용</option>
                    </select>
                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="검색어를 입력하세요"
                        className="min-w-[200px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    />
                    <button
                        type="submit"
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                    >
                        검색
                    </button>
                </form>
            </div>

            {error && <div className="mx-5 mt-4 text-sm text-amber-300">{error}</div>}

            {loading ? (
                <div className="px-5 py-16 text-center text-slate-500">불러오는 중...</div>
            ) : (
                <div className="overflow-x-auto px-2 pb-6 sm:px-5">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-500">
                                <th className="w-[120px] px-3 py-3 font-medium">구분</th>
                                <th className="px-3 py-3 font-medium">제목</th>
                                <th className="w-[140px] px-3 py-3 font-medium">작성자</th>
                                <th className="w-[110px] px-3 py-3 font-medium">작성일</th>
                                <th className="w-[72px] px-3 py-3 font-medium text-right">조회</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-12 text-center text-slate-500">
                                        등록된 글이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {visiblePinnedNotices.map((row) => renderRow(row))}
                                    {showFreeBoardPinToggle ? (
                                        <tr className={styles.pinnedToggleRow}>
                                            <td colSpan={5}>
                                                <button
                                                    type="button"
                                                    className={styles.pinnedToggleBtn}
                                                    onClick={() => setFreeBoardPinExpanded((v) => !v)}
                                                >
                                                    {freeBoardPinExpanded ? (
                                                        <>
                                                            공지사항 접기 <span aria-hidden>▲</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            공지사항 더보기 <span aria-hidden>▼</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ) : null}
                                    {otherNotices.map((row) => renderRow(row))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="border-t border-slate-800 px-5 py-6">
                <ListPagination
                    page={page}
                    size={size}
                    totalCount={totalCount}
                    onPageChange={setPage}
                    siblingCount={1}
                />
            </div>
        </div>
    );
}
