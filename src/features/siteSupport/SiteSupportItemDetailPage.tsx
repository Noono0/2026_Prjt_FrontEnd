"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BoardEditor from "@/components/editor/BoardEditor";
import { normalizeSoopEmbedInHtml } from "@/lib/normalizeSoopEmbedInHtml";
import { deleteSiteSupport, fetchSiteSupportDetail, updateSiteSupport } from "./api";
import type { SiteSupportCategoryCode, SiteSupportRow } from "./types";
import { SUPPORT_CATEGORY_OPTIONS, supportCategoryLabel } from "./labels";
import { confirmSonner, sonner } from "@/lib/sonner";

type Props = { supportSeq: number };

function isEmptyBoardHtml(html: string): boolean {
    const t = html.trim();
    if (!t || t === "<p></p>") return true;
    const plain = t
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .trim();
    return plain.length === 0 && !t.toLowerCase().includes("<img");
}

export default function SiteSupportItemDetailPage({ supportSeq }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editMode = searchParams.get("mode") === "edit";

    const [item, setItem] = useState<SiteSupportRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        categoryCode: "AD" as SiteSupportCategoryCode,
        title: "",
        linkUrl: "",
        content: "",
        showYn: true,
        sortOrder: "0",
    });

    useEffect(() => {
        let cancel = false;
        void (async () => {
            setLoading(true);
            setError(null);
            try {
                const detail = await fetchSiteSupportDetail(supportSeq);
                if (cancel) return;
                setItem(detail);
                const cat = (detail.categoryCode ?? "AD").toUpperCase() as SiteSupportCategoryCode;
                setEditForm({
                    categoryCode: ["AD", "SPONSOR", "HELPER"].includes(cat) ? cat : "AD",
                    title: detail.title ?? "",
                    linkUrl: detail.linkUrl ?? "",
                    content: detail.content ?? "",
                    showYn: detail.showYn === "Y",
                    sortOrder: String(detail.sortOrder ?? 0),
                });
            } catch (e) {
                if (!cancel) {
                    setItem(null);
                    setError(e instanceof Error ? e.message : "불러오지 못했습니다.");
                }
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => {
            cancel = true;
        };
    }, [supportSeq]);

    const onSave = async () => {
        if (!item?.supportSeq) return;
        if (!editForm.title.trim()) {
            sonner.warning("제목을 입력해주세요.");
            return;
        }
        if (isEmptyBoardHtml(editForm.content)) {
            sonner.warning("내용을 입력해주세요.");
            return;
        }
        const so = Math.max(0, parseInt(editForm.sortOrder, 10) || 0);
        setSaving(true);
        try {
            const n = await updateSiteSupport({
                supportSeq: item.supportSeq,
                categoryCode: editForm.categoryCode,
                title: editForm.title.trim(),
                content: editForm.content,
                linkUrl: editForm.linkUrl.trim() || null,
                showYn: editForm.showYn ? "Y" : "N",
                sortOrder: so,
            });
            if (n > 0) {
                const detail = await fetchSiteSupportDetail(supportSeq);
                setItem(detail);
                router.replace(`/admin/support-items/${supportSeq}`);
                sonner.success("수정되었습니다.");
            } else {
                sonner.error("수정에 실패했습니다.");
            }
        } catch (e) {
            sonner.error(e instanceof Error ? e.message : "수정에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        if (!item?.supportSeq) return;
        // TODO: ConfirmDialog 검토 — 항목 삭제 확인을 중앙 모달로 옮길지 추후 결정
        if (!(await confirmSonner("이 항목을 삭제할까요?"))) return;
        try {
            const n = await deleteSiteSupport(item.supportSeq);
            if (n > 0) {
                router.push("/admin/support-items");
            } else {
                sonner.error("삭제에 실패했습니다.");
            }
        } catch (e) {
            sonner.error(e instanceof Error ? e.message : "삭제에 실패했습니다.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] px-5 py-10 text-center text-slate-400">
                불러오는 중...
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] px-5 py-10 text-center text-amber-300">
                {error ?? "데이터가 없습니다."}
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
                <div>
                    {editMode ? (
                        <input
                            value={editForm.title}
                            onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value.slice(0, 500) }))}
                            maxLength={500}
                            className="w-full max-w-2xl rounded-lg border border-slate-700 bg-[#081326] px-4 py-3 text-2xl font-bold text-white outline-none"
                        />
                    ) : (
                        <h1 className="text-2xl font-bold text-white">{item.title ?? "(제목 없음)"}</h1>
                    )}
                    <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <span>번호 {item.supportSeq}</span>
                            <span>분류: {supportCategoryLabel(item.categoryCode)}</span>
                            <span>목록 노출: {item.showYn === "Y" ? "Y" : "N"}</span>
                            <span>정렬: {item.sortOrder ?? 0}</span>
                        </div>
                        {!editMode && item.linkUrl ? (
                            <div>
                                <span className="text-slate-500">바로가기 </span>
                                <a
                                    href={item.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="break-all text-sky-400 hover:underline"
                                >
                                    {item.linkUrl}
                                </a>
                            </div>
                        ) : null}
                        <div className="grid gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-500 sm:grid-cols-2">
                            <span>
                                등록: {item.createDt ?? "-"} · {item.createId ?? "-"} · {item.createIp ?? "-"}
                            </span>
                            <span>
                                수정: {item.modifyDt ?? "-"} · {item.modifyId ?? "-"} · {item.modifyIp ?? "-"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {editMode ? (
                        <>
                            <button
                                type="button"
                                onClick={() => void onSave()}
                                disabled={saving}
                                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                                {saving ? "저장 중..." : "저장"}
                            </button>
                            <Link
                                href={`/admin/support-items/${supportSeq}`}
                                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100"
                            >
                                취소
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href={`/admin/support-items/${supportSeq}?mode=edit`}
                                className="rounded-lg border border-sky-600 bg-sky-900/30 px-4 py-2 text-sm font-medium text-sky-200"
                            >
                                수정
                            </Link>
                            <button
                                type="button"
                                onClick={() => void onDelete()}
                                className="rounded-lg border border-rose-700 bg-rose-950/40 px-4 py-2 text-sm text-rose-200"
                            >
                                삭제
                            </button>
                            <Link
                                href="/admin/support-items"
                                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200"
                            >
                                목록
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="px-5 py-6">
                {editMode ? (
                    <>
                        <div className="mb-6 grid gap-4 lg:grid-cols-3">
                            <div className="space-y-2 rounded-xl border border-slate-800 bg-[#0b1526] p-3">
                                <div className="text-sm font-semibold text-slate-200">분류</div>
                                <select
                                    value={editForm.categoryCode}
                                    onChange={(e) =>
                                        setEditForm((p) => ({
                                            ...p,
                                            categoryCode: e.target.value as SiteSupportCategoryCode,
                                        }))
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                                >
                                    {SUPPORT_CATEGORY_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2 rounded-xl border border-slate-800 bg-[#0b1526] p-3">
                                <div className="text-sm font-semibold text-slate-200">목록 노출</div>
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={editForm.showYn}
                                        onChange={(e) => setEditForm((p) => ({ ...p, showYn: e.target.checked }))}
                                    />
                                    표시 (Y)
                                </label>
                            </div>
                            <div className="space-y-2 rounded-xl border border-slate-800 bg-[#0b1526] p-3">
                                <div className="text-sm font-semibold text-slate-200">정렬 순서</div>
                                <input
                                    type="number"
                                    min={0}
                                    value={editForm.sortOrder}
                                    onChange={(e) => setEditForm((p) => ({ ...p, sortOrder: e.target.value }))}
                                    className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="mb-2 text-xs font-medium text-slate-500">바로가기 링크</div>
                            <input
                                value={editForm.linkUrl}
                                onChange={(e) => setEditForm((p) => ({ ...p, linkUrl: e.target.value }))}
                                className="h-11 w-full rounded-xl border border-slate-700 bg-[#081326] px-4 text-sm text-slate-100 outline-none focus:border-sky-600"
                                placeholder="https://..."
                            />
                        </div>
                        <BoardEditor
                            value={editForm.content}
                            onChange={(html) => setEditForm((p) => ({ ...p, content: html }))}
                            videoPasteEnabled
                        />
                    </>
                ) : (
                    <>
                        <div
                            className="board-detail-content prose prose-invert max-w-none break-words text-slate-100"
                            dangerouslySetInnerHTML={{
                                __html: normalizeSoopEmbedInHtml(item.content ?? ""),
                            }}
                        />
                        {item.linkUrl ? (
                            <div className="mt-6">
                                <a
                                    href={item.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
                                >
                                    바로가기 열기
                                </a>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}
