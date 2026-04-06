"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ListPagination from "@/components/ui/ListPagination";
import { AuthorCellWithMenu } from "@/components/author/AuthorCellWithMenu";
import { useAuthStore } from "@/stores/authStore";
import {
    type BlacklistCategoryOption,
    downloadBlacklistReportExcel,
    fetchBlacklistListCategories,
    searchBlacklistReports,
} from "./api";
import type { BlacklistReportListItem } from "./types";
import { isNewWithin24Hours } from "@/lib/listDateUtils";
import {
    BLACKLIST_EXCEL_COLUMN_OPTIONS,
    DEFAULT_BLACKLIST_EXCEL_KEYS,
    loadStoredExcelColumnKeys,
    normalizeExcelColumnKeys,
    saveStoredExcelColumnKeys,
} from "./excelExport";

function categoryFilterToRequest(c: { label: string; value: string }): string | null {
    if (c.label === "전체") return null;
    const v = c.value;
    if (v != null && String(v).trim() !== "") return String(v).trim();
    return c.label.trim();
}

/** 기본 작성일 필터: 한 달 전 ~ 오늘 (로컬 날짜) */
function getDefaultCreateDateRange(): { from: string; to: string } {
    const to = new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - 1);
    const ymd = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { from: ymd(from), to: ymd(to) };
}

const DEFAULT_CREATE_RANGE = getDefaultCreateDateRange();

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

export default function BlacklistReportPage() {
    const { user } = useAuthStore();
    const [categoryCode, setCategoryCode] = useState<string | null>(null);
    const [categories, setCategories] = useState<BlacklistCategoryOption[]>([]);
    const [blacklistTargetIdDraft, setBlacklistTargetIdDraft] = useState("");
    const [keywordDraft, setKeywordDraft] = useState("");
    const [appliedBlacklistTargetId, setAppliedBlacklistTargetId] = useState("");
    const [appliedKeyword, setAppliedKeyword] = useState("");
    const [dateRangeEnabled, setDateRangeEnabled] = useState(true);
    const [dateFromDraft, setDateFromDraft] = useState(DEFAULT_CREATE_RANGE.from);
    const [dateToDraft, setDateToDraft] = useState(DEFAULT_CREATE_RANGE.to);
    const [appliedDateFrom, setAppliedDateFrom] = useState(DEFAULT_CREATE_RANGE.from);
    const [appliedDateTo, setAppliedDateTo] = useState(DEFAULT_CREATE_RANGE.to);
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [items, setItems] = useState<BlacklistReportListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [excelColumnModalOpen, setExcelColumnModalOpen] = useState(false);
    const [excelColumnDraft, setExcelColumnDraft] = useState<string[]>(DEFAULT_BLACKLIST_EXCEL_KEYS);

    const requestBody = useMemo(
        () => ({
            page,
            size,
            sortBy: "blacklistReportSeq",
            sortDir: "desc" as const,
            ...(categoryCode ? { categoryCode } : {}),
            ...(appliedBlacklistTargetId.trim() ? { blacklistTargetId: appliedBlacklistTargetId.trim() } : {}),
            ...(appliedKeyword.trim() ? { keyword: appliedKeyword.trim() } : {}),
            ...(dateRangeEnabled && appliedDateFrom && appliedDateTo
                ? { createDtFrom: appliedDateFrom, createDtTo: appliedDateTo }
                : {}),
        }),
        [page, size, categoryCode, appliedBlacklistTargetId, appliedKeyword, dateRangeEnabled, appliedDateFrom, appliedDateTo]
    );

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await searchBlacklistReports(requestBody);
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
                const res = await fetchBlacklistListCategories();
                setCategories(res);
            } catch {
                setCategories([]);
            }
        };
        void loadCategories();
    }, []);

    useEffect(() => {
        setExcelColumnDraft(loadStoredExcelColumnKeys());
    }, []);

    const onCategoryClick = (code: string | null) => {
        setCategoryCode(code);
        setPage(1);
    };

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setAppliedBlacklistTargetId(blacklistTargetIdDraft);
        setAppliedKeyword(keywordDraft);
        let df = dateFromDraft;
        let dt = dateToDraft;
        if (dateRangeEnabled && df && dt && df > dt) {
            const tmp = df;
            df = dt;
            dt = tmp;
            setDateFromDraft(df);
            setDateToDraft(dt);
        }
        setAppliedDateFrom(df);
        setAppliedDateTo(dt);
    };

    const appliedExcelKeys = normalizeExcelColumnKeys(excelColumnDraft);

    const onExport = async () => {
        setExporting(true);
        try {
            await downloadBlacklistReportExcel({
                blacklistTargetId: appliedBlacklistTargetId.trim() || undefined,
                keyword: appliedKeyword.trim() || undefined,
                categoryCode: categoryCode ?? undefined,
                columns: appliedExcelKeys,
                ...(dateRangeEnabled && appliedDateFrom && appliedDateTo
                    ? { createDtFrom: appliedDateFrom, createDtTo: appliedDateTo }
                    : {}),
            });
        } catch (e) {
            alert(e instanceof Error ? e.message : "엑셀 다운로드에 실패했습니다.");
        } finally {
            setExporting(false);
        }
    };

    const openExcelColumnModal = () => {
        setExcelColumnDraft(loadStoredExcelColumnKeys());
        setExcelColumnModalOpen(true);
    };

    const toggleExcelColumn = (key: string) => {
        setExcelColumnDraft((prev) => {
            const set = new Set(prev);
            if (set.has(key)) {
                set.delete(key);
            } else {
                set.add(key);
            }
            return normalizeExcelColumnKeys([...set]);
        });
    };

    const selectAllExcelColumns = () => {
        setExcelColumnDraft(BLACKLIST_EXCEL_COLUMN_OPTIONS.map((o) => o.key));
    };

    const resetExcelColumnsDefault = () => {
        setExcelColumnDraft([...DEFAULT_BLACKLIST_EXCEL_KEYS]);
    };

    const confirmExcelColumns = () => {
        const next = normalizeExcelColumnKeys(excelColumnDraft);
        saveStoredExcelColumnKeys(next);
        setExcelColumnDraft(next);
        setExcelColumnModalOpen(false);
    };

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">블랙리스트 제보</h1>
                    <p className="mt-1 text-sm text-slate-500">제보 대상 아이디를 기록하고, 목록·엑셀에서 동일 아이디로 묶어 조회할 수 있습니다.</p>
                </div>
                <Link
                    href="/blacklist-report/write"
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                >
                    글쓰기
                </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-5 py-3">
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

            <form onSubmit={onSearch} className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 lg:flex-row lg:flex-wrap lg:items-end">
                <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-500">블랙리스트 아이디 (부분 검색)</label>
                    <input
                        value={blacklistTargetIdDraft}
                        onChange={(e) => setBlacklistTargetIdDraft(e.target.value)}
                        placeholder="예: baduser123"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-600"
                    />
                </div>
                <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-500">제목·내용</label>
                    <input
                        value={keywordDraft}
                        onChange={(e) => setKeywordDraft(e.target.value)}
                        placeholder="검색어"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-600"
                    />
                </div>
                <div className="flex w-full flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 lg:w-auto lg:min-w-[320px]">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-400">
                        <input
                            type="checkbox"
                            checked={dateRangeEnabled}
                            onChange={(e) => setDateRangeEnabled(e.target.checked)}
                            className="rounded border-slate-600 text-sky-600 focus:ring-sky-600"
                        />
                        작성일 기간 적용
                    </label>
                    <div className={`flex flex-wrap items-center gap-2 ${!dateRangeEnabled ? "pointer-events-none opacity-45" : ""}`}>
                        <input
                            type="date"
                            value={dateFromDraft}
                            onChange={(e) => setDateFromDraft(e.target.value)}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-600"
                            aria-label="작성일 시작"
                        />
                        <span className="text-slate-500">~</span>
                        <input
                            type="date"
                            value={dateToDraft}
                            onChange={(e) => setDateToDraft(e.target.value)}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-600"
                            aria-label="작성일 끝"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="submit"
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
                    >
                        검색
                    </button>
                    <button
                        type="button"
                        onClick={openExcelColumnModal}
                        className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                    >
                        엑셀 칼럼
                    </button>
                    <button
                        type="button"
                        disabled={exporting}
                        onClick={() => void onExport()}
                        className="rounded-lg border border-emerald-700 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-50"
                    >
                        {exporting ? "엑셀 생성 중…" : "엑셀 다운로드"}
                    </button>
                </div>
            </form>

            {excelColumnModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="blacklist-excel-col-title"
                >
                    <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-[#0c1017] shadow-2xl">
                        <div className="border-b border-slate-800 px-5 py-4">
                            <h2 id="blacklist-excel-col-title" className="text-lg font-bold text-white">
                                엑셀에 포함할 칼럼
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                체크한 항목만 시트에 표시됩니다. 순서는 목록과 동일합니다. 설정은 이 브라우저에 저장됩니다.
                            </p>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto px-5 py-3">
                            <ul className="space-y-2">
                                {BLACKLIST_EXCEL_COLUMN_OPTIONS.map((opt) => (
                                    <li key={opt.key}>
                                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 hover:border-slate-700 hover:bg-slate-900/80">
                                            <input
                                                type="checkbox"
                                                checked={excelColumnDraft.includes(opt.key)}
                                                onChange={() => toggleExcelColumn(opt.key)}
                                                className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-600"
                                            />
                                            <span className="text-sm text-slate-200">{opt.label}</span>
                                            <span className="ml-auto font-mono text-[10px] text-slate-600">{opt.key}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 px-5 py-4">
                            <button
                                type="button"
                                onClick={selectAllExcelColumns}
                                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                            >
                                전체 선택
                            </button>
                            <button
                                type="button"
                                onClick={resetExcelColumnsDefault}
                                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                            >
                                기본값
                            </button>
                            <div className="ml-auto flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setExcelColumnModalOpen(false)}
                                    className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900"
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmExcelColumns}
                                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {error && (
                <div className="mx-5 mt-4 rounded-lg border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="px-5 py-16 text-center text-slate-500">불러오는 중…</div>
            ) : (
                <div className="overflow-x-auto px-2 pb-6 sm:px-5">
                    <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-500">
                                <th className="w-[100px] px-3 py-3 font-medium">카테고리</th>
                                <th className="w-[140px] px-3 py-3 font-medium">블랙리스트 아이디</th>
                                <th className="px-3 py-3 font-medium">제목</th>
                                <th className="w-[140px] px-3 py-3 font-medium">작성자</th>
                                <th className="w-[100px] px-3 py-3 font-medium">작성일</th>
                                <th className="w-[56px] px-3 py-3 font-medium text-right">조회</th>
                                <th className="w-[56px] px-3 py-3 font-medium text-right">추천</th>
                                <th className="w-[56px] px-3 py-3 font-medium text-right">비추천</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-3 py-12 text-center text-slate-500">
                                        등록된 글이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                items.map((row) => (
                                    <tr key={row.blacklistReportSeq} className="border-b border-slate-800/80 hover:bg-slate-900/60">
                                        <td className="px-3 py-3 text-xs text-slate-400">
                                            {row.categoryName ?? row.categoryCode ?? "—"}
                                        </td>
                                        <td className="px-3 py-3 font-medium text-amber-200/90">{row.blacklistTargetId ?? "—"}</td>
                                        <td className="px-3 py-3">
                                            <Link
                                                href={`/blacklist-report/${row.blacklistReportSeq}`}
                                                className="text-slate-100 hover:text-sky-400"
                                            >
                                                {row.title ?? "(제목 없음)"}
                                            </Link>
                                            {row.createDt && isNewWithin24Hours(row.createDt) ? (
                                                <span className="ml-2 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                                    NEW
                                                </span>
                                            ) : null}
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
                                        <td className="px-3 py-3 text-right tabular-nums text-sky-400">{row.likeCount ?? 0}</td>
                                        <td className="px-3 py-3 text-right tabular-nums text-slate-500">{row.dislikeCount ?? 0}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="border-t border-slate-800 px-5 py-6">
                <ListPagination page={page} size={size} totalCount={totalCount} onPageChange={setPage} siblingCount={1} />
            </div>
        </div>
    );
}
