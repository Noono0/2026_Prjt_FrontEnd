"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ListPagination from "@/components/ui/ListPagination";
import { fetchNoticeBoardsPinnedOnFreeBoard } from "@/features/noticeBoards/api";
import type { NoticeBoardListItem } from "@/features/noticeBoards/types";
import { fetchBoardCategories, fetchBoardPopularConfig, searchBoards } from "./api";
import type { BoardCategoryOption, BoardListItem, BoardSearchCondition } from "./types";
import { useAuthStore } from "@/stores/authStore";
import styles from "./BoardsPage.module.css";
import { postHtmlContainsImage } from "@/lib/postHtmlHasImage";
import { isNewWithin24Hours } from "@/lib/listDateUtils";
import { AuthorCellWithMenu } from "@/components/author/AuthorCellWithMenu";

type SearchField = "title" | "all";

/** 자유게시판 상단 고정 블록에서 기본으로 보여 줄 개수 */
const PINNED_PREVIEW_COUNT = 5;

/** 공통코드 code_value가 비어 있으면 라벨( code_name )을 요청값으로 보내 인기글 탭 매칭이 되게 함 */
function categoryFilterToRequest(c: { label: string; value: string }): string | null {
    if (c.label === "전체") return null;
    const v = c.value;
    if (v != null && String(v).trim() !== "") return String(v).trim();
    return c.label.trim();
}

function isBoardRowPinHighlighted(row: BoardListItem): boolean {
    return (
        row.pinOnFreeBoardYn === "Y" ||
        row.noticeBoardSeq != null ||
        row.highlightYn === "Y"
    );
}

function PopularBadge({ label }: { label: string }) {
    return (
        <span
            className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
            aria-label="인기글"
        >
            {label}
        </span>
    );
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

function mapNoticePinToBoardRow(n: NoticeBoardListItem): BoardListItem {
    return {
        noticeBoardSeq: n.noticeBoardSeq,
        title: n.title,
        content: n.content,
        writerName: n.writerName,
        writerMemberSeq: n.writerMemberSeq,
        writerProfileImageUrl: n.writerProfileImageUrl,
        viewCount: n.viewCount,
        likeCount: n.likeCount,
        commentCount: n.commentCount,
        createDt: n.createDt,
        highlightYn: "Y",
        pinOnFreeBoardYn: n.pinOnFreeBoardYn ?? "Y",
        categoryName: "공지",
    };
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
    const { user } = useAuthStore();
    const [categoryCode, setCategoryCode] = useState<string | null>(null);
    const [searchField, setSearchField] = useState<SearchField>("all");
    const [searchText, setSearchText] = useState("");
    const [appliedSearch, setAppliedSearch] = useState({ field: "all" as SearchField, text: "" });
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [noticeExpanded, setNoticeExpanded] = useState(false);
    const [categories, setCategories] = useState<BoardCategoryOption[]>([]);

    const [items, setItems] = useState<BoardListItem[]>([]);
    const [noticePinRows, setNoticePinRows] = useState<BoardListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [popularConfig, setPopularConfig] = useState<{ threshold: number; badgeLabel: string }>({
        threshold: 50,
        badgeLabel: "인기글",
    });

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
            const [res, noticePins] = await Promise.all([
                searchBoards(requestBody),
                fetchNoticeBoardsPinnedOnFreeBoard().catch(() => [] as NoticeBoardListItem[]),
            ]);
            setItems(res.items ?? []);
            setTotalCount(res.totalCount ?? 0);
            setNoticePinRows((noticePins ?? []).map(mapNoticePinToBoardRow));
        } catch (e) {
            setItems([]);
            setNoticePinRows([]);
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
                const res = await fetchBoardCategories();
                setCategories(res);
            } catch {
                setCategories([]);
            }
        };
        void loadCategories();
    }, []);

    useEffect(() => {
        void (async () => {
            try {
                const c = await fetchBoardPopularConfig();
                setPopularConfig({
                    threshold: typeof c.threshold === "number" && c.threshold >= 0 ? c.threshold : 50,
                    badgeLabel: c.badgeLabel?.trim() || "인기글",
                });
            } catch {
                /* 기본값 유지 */
            }
        })();
    }, []);

    const pinned = useMemo(() => {
        const fromBoard = items.filter((r) => r.highlightYn === "Y");
        return [...noticePinRows, ...fromBoard];
    }, [items, noticePinRows]);
    const normal = useMemo(() => items.filter((r) => r.highlightYn !== "Y"), [items]);
    const visiblePinned = noticeExpanded ? pinned : pinned.slice(0, PINNED_PREVIEW_COUNT);
    const showPinnedToggle = pinned.length > PINNED_PREVIEW_COUNT;

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setAppliedSearch({ field: searchField, text: searchText });
    };

    const onCategoryClick = (code: string | null) => {
        setCategoryCode(code);
        setPage(1);
    };

    const getBoardHref = (row: BoardListItem) => {
        if (row.noticeBoardSeq != null) {
            const isMine =
                typeof user?.memberSeq === "number" &&
                typeof row.writerMemberSeq === "number" &&
                user.memberSeq === row.writerMemberSeq;
            return isMine
                ? `/notice-board/${row.noticeBoardSeq}?mode=edit`
                : `/notice-board/${row.noticeBoardSeq}`;
        }
        const isMine =
            typeof user?.memberSeq === "number" &&
            typeof row.writerMemberSeq === "number" &&
            user.memberSeq === row.writerMemberSeq;
        return isMine ? `/boards/${row.boardSeq}?mode=edit` : `/boards/${row.boardSeq}`;
    };

    const rowKey = (row: BoardListItem) =>
        row.noticeBoardSeq != null ? `notice-pin-${row.noticeBoardSeq}` : `board-${row.boardSeq}`;

    const renderBadgeLabel = (row: BoardListItem) => {
        if (row.noticeBoardSeq != null) return "공지사항";
        if (row.highlightYn === "Y") return "공지";
        return null;
    };

    const isPopularLikes = (likes: number) => likes >= popularConfig.threshold;

    const renderListRow = (row: BoardListItem) => {
        const pinHi = isBoardRowPinHighlighted(row);
        const badgeOverride = renderBadgeLabel(row);
        const isNotice = badgeOverride != null;
        const cc = row.commentCount ?? 0;
        const likes = row.likeCount ?? 0;
        const popular = isPopularLikes(likes);
        const hasImage = postHtmlContainsImage(row.content);
        return (
            <tr
                key={rowKey(row)}
                className={`border-b border-slate-800/80 hover:bg-slate-900/60 ${pinHi ? styles.rowPinHighlight : ""}`}
            >
                <td className="px-3 py-3 align-top">
                    {isNotice ? (
                        <span className="inline-block rounded bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                            {badgeOverride}
                        </span>
                    ) : (
                        <span className="text-slate-400">{row.categoryName ?? row.categoryCode ?? "-"}</span>
                    )}
                </td>
                <td className="px-3 py-3">
                    <div className={styles.titleRow}>
                        <Link href={getBoardHref(row)} className="text-slate-100 hover:text-sky-400">
                            {row.title ?? "(제목 없음)"}
                        </Link>
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
                        {popular ? <PopularBadge label={popularConfig.badgeLabel} /> : null}
                    </div>
                </td>
                <td className="px-3 py-3">
                    <AuthorCellWithMenu
                        memberSeq={row.writerMemberSeq}
                        memberId={row.writerMemberId}
                        nickname={row.writerName}
                        profileImageUrl={row.writerProfileImageUrl}
                        currentMemberSeq={user?.memberSeq}
                        variant="default"
                    />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-400">{formatListDate(row.createDt)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-400">{row.viewCount ?? 0}</td>
                <td
                    className={`px-3 py-3 text-right font-medium tabular-nums ${
                        popular ? "text-red-500" : "text-sky-400"
                    }`}
                >
                    {likes}
                </td>
            </tr>
        );
    };

    const renderGridCard = (row: BoardListItem) => {
        const cc = row.commentCount ?? 0;
        const likes = row.likeCount ?? 0;
        const hasImage = postHtmlContainsImage(row.content);
        const pinHi = isBoardRowPinHighlighted(row);
        const badgeOverride = renderBadgeLabel(row);
        const popular = isPopularLikes(likes);
        return (
            <article
                key={rowKey(row)}
                className={`rounded-xl border border-slate-800 bg-slate-900/50 p-4 ${pinHi ? styles.cardPinHighlight : ""}`}
            >
                <div className="mb-2 flex items-center justify-between gap-2">
                    {badgeOverride != null ? (
                        <span className="rounded bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                            {badgeOverride}
                        </span>
                    ) : (
                        <span className="text-xs text-slate-500">{row.categoryName ?? row.categoryCode}</span>
                    )}
                    <span className="text-xs text-slate-500">{formatListDate(row.createDt)}</span>
                </div>
                <h2 className="line-clamp-2 font-medium text-slate-100">
                    <span className={styles.titleRow}>
                        <Link href={getBoardHref(row)} className="hover:text-sky-400">
                            {row.title}
                        </Link>
                        {hasImage && <ImageAttachIcon />}
                        {cc > 0 && <span className={styles.commentCount}>[{cc}]</span>}
                        {isNewWithin24Hours(row.createDt) ? (
                            <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                NEW
                            </span>
                        ) : null}
                        {popular ? <PopularBadge label={popularConfig.badgeLabel} /> : null}
                    </span>
                </h2>
                <div className="mt-3 flex justify-between text-xs text-slate-500">
                    <AuthorCellWithMenu
                        memberSeq={row.writerMemberSeq}
                        memberId={row.writerMemberId}
                        nickname={row.writerName}
                        profileImageUrl={row.writerProfileImageUrl}
                        currentMemberSeq={user?.memberSeq}
                        variant="compact"
                        className="max-w-[min(12rem,45%)]"
                    />
                    <span>
                        조회 {row.viewCount ?? 0} · 추천{" "}
                        <span className={popular ? "font-semibold text-red-500" : "text-sky-400"}>{likes}</span>
                    </span>
                </div>
            </article>
        );
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

                    {[{ label: "전체", value: "" }, ...categories].map((c) => {
                        const filterKey = categoryFilterToRequest(c);
                        return (
                            <button
                                key={`${c.label}-${filterKey ?? "all"}`}
                                type="button"
                                onClick={() => onCategoryClick(filterKey)}
                                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                                    categoryCode === filterKey
                                        ? "border-sky-400 bg-sky-600 text-white"
                                        : "border-slate-600 bg-slate-900/80 text-slate-400 hover:border-slate-500 hover:bg-slate-800 hover:text-slate-200"
                                }`}
                            >
                                {c.label}
                            </button>
                        );
                    })}
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
                            {visiblePinned.length === 0 && normal.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-12 text-center text-slate-500">
                                        등록된 글이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {visiblePinned.map((row) => renderListRow(row))}
                                    {showPinnedToggle ? (
                                        <tr className={styles.pinnedToggleRow}>
                                            <td colSpan={6}>
                                                <button
                                                    type="button"
                                                    className={styles.pinnedToggleBtn}
                                                    onClick={() => setNoticeExpanded((v) => !v)}
                                                >
                                                    {noticeExpanded ? (
                                                        <>
                                                            공지 접기 <span aria-hidden>▲</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            공지 더보기 <span aria-hidden>▼</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ) : null}
                                    {normal.map((row) => renderListRow(row))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid gap-4 px-5 pb-6 sm:grid-cols-2 lg:grid-cols-3">
                    {visiblePinned.length === 0 && normal.length === 0 ? (
                        <p className="col-span-full py-12 text-center text-slate-500">등록된 글이 없습니다.</p>
                    ) : (
                        <>
                            {visiblePinned.map((row) => renderGridCard(row))}
                            {showPinnedToggle ? (
                                <div className="col-span-full flex justify-center">
                                    <button
                                        type="button"
                                        className={`${styles.pinnedToggleBtn} rounded-lg border border-slate-700/80`}
                                        onClick={() => setNoticeExpanded((v) => !v)}
                                    >
                                        {noticeExpanded ? (
                                            <>
                                                공지 접기 <span aria-hidden>▲</span>
                                            </>
                                        ) : (
                                            <>
                                                공지 더보기 <span aria-hidden>▼</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : null}
                            {normal.map((row) => renderGridCard(row))}
                        </>
                    )}
                </div>
            )}

            <div className="border-t border-slate-800 px-5 py-6">
                <ListPagination page={page} size={size} totalCount={totalCount} onPageChange={setPage} siblingCount={1} />
            </div>
        </div>
    );
}

