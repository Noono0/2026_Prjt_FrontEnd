"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ListPagination from "@/components/ui/ListPagination";
import {
    createContentFilterWord,
    deleteContentFilterWord,
    searchContentFilterWords,
    updateContentFilterWord,
} from "./api";
import type { ContentFilterWordRow, ContentFilterWordSearchCondition } from "./types";

function formatListDate(dt?: string): string {
    if (!dt) return "-";
    const d = new Date(dt.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return dt.slice(0, 16);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const emptyForm = () => ({
    contentFilterWordSeq: undefined as number | undefined,
    category: "PROFANITY" as "PROFANITY" | "AD",
    keyword: "",
    sortOrder: 0,
    remark: "",
    useYn: "Y" as "Y" | "N",
});

export default function ContentFilterWordsPage() {
    const [listKeyword, setListKeyword] = useState("");
    const [appliedListKeyword, setAppliedListKeyword] = useState("");
    const [listCategory, setListCategory] = useState<"" | "PROFANITY" | "AD">("");
    const [appliedListCategory, setAppliedListCategory] = useState<"" | "PROFANITY" | "AD">("");
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [items, setItems] = useState<ContentFilterWordRow[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const requestBody = useMemo((): ContentFilterWordSearchCondition => {
        const body: ContentFilterWordSearchCondition = {
            page,
            size,
            sortBy: "contentFilterWordSeq",
            sortDir: "desc",
        };
        const q = appliedListKeyword.trim();
        if (q) body.keyword = q;
        if (appliedListCategory) body.category = appliedListCategory;
        return body;
    }, [appliedListKeyword, appliedListCategory, page, size]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await searchContentFilterWords(requestBody);
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

    const onSearchList = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setAppliedListKeyword(listKeyword);
        setAppliedListCategory(listCategory);
    };

    const resetForm = () => {
        setForm(emptyForm());
        setFormError(null);
    };

    const onEdit = (row: ContentFilterWordRow) => {
        setForm({
            contentFilterWordSeq: row.contentFilterWordSeq,
            category: row.category === "AD" ? "AD" : "PROFANITY",
            keyword: row.keyword ?? "",
            sortOrder: row.sortOrder ?? 0,
            remark: row.remark ?? "",
            useYn: row.useYn === "N" ? "N" : "Y",
        });
        setFormError(null);
    };

    const onSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        const kw = form.keyword.trim();
        if (!kw) {
            setFormError("키워드를 입력해주세요.");
            return;
        }
        setSaving(true);
        try {
            const body = {
                contentFilterWordSeq: form.contentFilterWordSeq,
                category: form.category,
                keyword: kw,
                sortOrder: form.sortOrder ?? 0,
                remark: form.remark.trim() || undefined,
                useYn: form.contentFilterWordSeq ? form.useYn : "Y",
            };
            if (form.contentFilterWordSeq) {
                await updateContentFilterWord(body);
            } else {
                await createContentFilterWord(body);
            }
            resetForm();
            await load();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (row: ContentFilterWordRow) => {
        if (!window.confirm(`「${row.keyword}」 항목을 삭제할까요?`)) return;
        setError(null);
        try {
            await deleteContentFilterWord(row.contentFilterWordSeq);
            if (form.contentFilterWordSeq === row.contentFilterWordSeq) {
                resetForm();
            }
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
        }
    };

    const categoryLabel = (c: string) => (c === "AD" ? "광고" : "비속어");

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">비속어·광고 필터</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        저장 시 게시글·공지·팝업·댓글 본문에 아래 키워드가 포함되면 동일 길이만큼 * 로 치환됩니다.
                    </p>
                </div>
            </div>

            <div className="border-b border-slate-800 px-5 py-4">
                <form onSubmit={onSubmitForm} className="grid gap-4 rounded-xl border border-slate-800 bg-[#081326] p-4 sm:grid-cols-2 lg:grid-cols-12">
                    <div className="sm:col-span-1 lg:col-span-2">
                        <div className="mb-1 text-xs font-medium text-slate-500">구분</div>
                        <select
                            value={form.category}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    category: e.target.value === "AD" ? "AD" : "PROFANITY",
                                }))
                            }
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#0c1017] px-3 text-slate-100"
                        >
                            <option value="PROFANITY">비속어 (PROFANITY)</option>
                            <option value="AD">광고 (AD)</option>
                        </select>
                    </div>
                    <div className="sm:col-span-1 lg:col-span-4">
                        <div className="mb-1 text-xs font-medium text-slate-500">키워드 *</div>
                        <input
                            value={form.keyword}
                            onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
                            placeholder="치환할 단어·문구"
                            maxLength={200}
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#0c1017] px-3 text-slate-100"
                        />
                    </div>
                    <div className="sm:col-span-1 lg:col-span-1">
                        <div className="mb-1 text-xs font-medium text-slate-500">정렬</div>
                        <input
                            type="number"
                            value={form.sortOrder}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                            }
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#0c1017] px-3 text-slate-100"
                        />
                    </div>
                    {form.contentFilterWordSeq ? (
                        <div className="sm:col-span-1 lg:col-span-1">
                            <div className="mb-1 text-xs font-medium text-slate-500">사용</div>
                            <select
                                value={form.useYn}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        useYn: e.target.value === "N" ? "N" : "Y",
                                    }))
                                }
                                className="h-10 w-full rounded-lg border border-slate-700 bg-[#0c1017] px-3 text-slate-100"
                            >
                                <option value="Y">Y</option>
                                <option value="N">N</option>
                            </select>
                        </div>
                    ) : (
                        <div className="hidden lg:col-span-1 lg:block" />
                    )}
                    <div className="sm:col-span-2 lg:col-span-4">
                        <div className="mb-1 text-xs font-medium text-slate-500">비고</div>
                        <input
                            value={form.remark}
                            onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                            placeholder="메모 (선택)"
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#0c1017] px-3 text-slate-100"
                        />
                    </div>
                    <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-12">
                        <button
                            type="submit"
                            disabled={saving}
                            className="h-10 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                        >
                            {form.contentFilterWordSeq ? "수정 저장" : "등록"}
                        </button>
                        {form.contentFilterWordSeq ? (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="h-10 rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm text-slate-100 hover:bg-slate-700"
                            >
                                신규로 바꾸기
                            </button>
                        ) : null}
                    </div>
                    {formError ? (
                        <div className="sm:col-span-2 lg:col-span-12 text-sm text-amber-300">{formError}</div>
                    ) : null}
                </form>
            </div>

            <div className="border-b border-slate-800 px-5 py-4">
                <form onSubmit={onSearchList} className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[140px]">
                        <div className="mb-1 text-xs font-medium text-slate-500">구분</div>
                        <select
                            value={listCategory}
                            onChange={(e) => setListCategory(e.target.value as "" | "PROFANITY" | "AD")}
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                        >
                            <option value="">전체</option>
                            <option value="PROFANITY">비속어</option>
                            <option value="AD">광고</option>
                        </select>
                    </div>
                    <div className="min-w-[200px] flex-1">
                        <div className="mb-1 text-xs font-medium text-slate-500">키워드</div>
                        <input
                            value={listKeyword}
                            onChange={(e) => setListKeyword(e.target.value)}
                            placeholder="부분 일치"
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
                {error && (
                    <div className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                        {error}
                    </div>
                )}
                {loading ? (
                    <div className="py-16 text-center text-slate-500">불러오는 중…</div>
                ) : (
                    <>
                        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
                                    <th className="px-3 py-2 font-medium">번호</th>
                                    <th className="px-3 py-2 font-medium">구분</th>
                                    <th className="px-3 py-2 font-medium">키워드</th>
                                    <th className="px-3 py-2 font-medium">정렬</th>
                                    <th className="px-3 py-2 font-medium">사용</th>
                                    <th className="px-3 py-2 font-medium">비고</th>
                                    <th className="px-3 py-2 font-medium">수정일</th>
                                    <th className="px-3 py-2 font-medium"> </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                                            등록된 필터 단어가 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((row) => (
                                        <tr
                                            key={row.contentFilterWordSeq}
                                            className="border-b border-slate-800/80 hover:bg-slate-900/60"
                                        >
                                            <td className="px-3 py-3 text-slate-400">{row.contentFilterWordSeq}</td>
                                            <td className="px-3 py-3 text-slate-300">{categoryLabel(row.category)}</td>
                                            <td className="px-3 py-3 font-medium text-slate-100">{row.keyword}</td>
                                            <td className="px-3 py-3 text-slate-400">{row.sortOrder ?? 0}</td>
                                            <td className="px-3 py-3">
                                                <span className={row.useYn === "Y" ? "text-emerald-400" : "text-slate-500"}>
                                                    {row.useYn === "Y" ? "Y" : "N"}
                                                </span>
                                            </td>
                                            <td className="max-w-[200px] truncate px-3 py-3 text-slate-500" title={row.remark ?? ""}>
                                                {row.remark || "—"}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-slate-400">{formatListDate(row.modifyDt)}</td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(row)}
                                                    className="mr-2 text-sky-400 hover:text-sky-300"
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void onDelete(row)}
                                                    className="text-rose-400 hover:text-rose-300"
                                                >
                                                    삭제
                                                </button>
                                            </td>
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
