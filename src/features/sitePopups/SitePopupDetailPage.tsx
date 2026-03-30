"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BoardEditor from "@/components/editor/BoardEditor";
import { deleteSitePopup, fetchSitePopupDetail, updateSitePopup } from "./api";
import type { SitePopupListItem } from "./types";
import {
    apiDateTimeToDatetimeLocal,
    datetimeLocalToApiDateTime,
    formatPopupPeriodRange,
    isNoticePopupActiveNow,
} from "@/lib/noticePopupSchedule";

type Props = { sitePopupSeq: number };

function isEmptyBoardHtml(html: string): boolean {
    const t = html.trim();
    if (!t || t === "<p></p>") return true;
    const plain = t.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();
    return plain.length === 0 && !t.toLowerCase().includes("<img");
}

export default function SitePopupDetailPage({ sitePopupSeq }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editMode = searchParams.get("mode") === "edit";

    const [item, setItem] = useState<SitePopupListItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        title: "",
        content: "",
        showYn: true,
        sortOrder: "0",
        popupType: "MODAL" as "MODAL" | "WINDOW",
        popupWidth: "600",
        popupHeight: "600",
        popupPosX: "",
        popupPosY: "",
        popupStartLocal: "",
        popupEndLocal: "",
    });

    useEffect(() => {
        let cancel = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const detail = await fetchSitePopupDetail(sitePopupSeq);
                if (cancel) return;
                setItem(detail);
                setEditForm({
                    title: detail.title ?? "",
                    content: detail.content ?? "",
                    showYn: detail.showYn === "Y",
                    sortOrder: String(detail.sortOrder ?? 0),
                    popupType: (detail.popupType ?? "MODAL").toUpperCase() === "WINDOW" ? "WINDOW" : "MODAL",
                    popupWidth: String(detail.popupWidth ?? 600),
                    popupHeight: String(detail.popupHeight ?? 600),
                    popupPosX: detail.popupPosX != null ? String(detail.popupPosX) : "",
                    popupPosY: detail.popupPosY != null ? String(detail.popupPosY) : "",
                    popupStartLocal: apiDateTimeToDatetimeLocal(detail.popupStartDt),
                    popupEndLocal: apiDateTimeToDatetimeLocal(detail.popupEndDt),
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
    }, [sitePopupSeq]);

    const onSave = async () => {
        if (!item?.sitePopupSeq) return;
        if (!editForm.title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        if (isEmptyBoardHtml(editForm.content)) {
            alert("내용을 입력해주세요.");
            return;
        }
        const pw = Math.min(2000, Math.max(200, parseInt(editForm.popupWidth, 10) || 600));
        const ph = Math.min(2000, Math.max(200, parseInt(editForm.popupHeight, 10) || 600));
        const px = editForm.popupPosX.trim() === "" ? null : Number(editForm.popupPosX);
        const py = editForm.popupPosY.trim() === "" ? null : Number(editForm.popupPosY);
        const so = Math.max(0, parseInt(editForm.sortOrder, 10) || 0);

        setSaving(true);
        try {
            const n = await updateSitePopup({
                sitePopupSeq: item.sitePopupSeq,
                title: editForm.title,
                content: editForm.content,
                showYn: editForm.showYn ? "Y" : "N",
                sortOrder: so,
                popupType: editForm.popupType,
                popupWidth: pw,
                popupHeight: ph,
                popupPosX: px != null && !Number.isNaN(px) ? px : null,
                popupPosY: py != null && !Number.isNaN(py) ? py : null,
                popupStartDt: datetimeLocalToApiDateTime(editForm.popupStartLocal),
                popupEndDt: datetimeLocalToApiDateTime(editForm.popupEndLocal),
            });
            if (n > 0) {
                const detail = await fetchSitePopupDetail(sitePopupSeq);
                setItem(detail);
                router.replace(`/site-popups/${sitePopupSeq}`);
                alert("수정되었습니다.");
            } else {
                alert("수정에 실패했습니다.");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "수정에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        if (!item?.sitePopupSeq) return;
        if (!confirm("이 팝업을 삭제할까요?")) return;
        try {
            const n = await deleteSitePopup(item.sitePopupSeq);
            if (n > 0) {
                router.push("/site-popups");
            } else {
                alert("삭제에 실패했습니다.");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
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
                            onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                            className="w-full max-w-2xl rounded-lg border border-slate-700 bg-[#081326] px-4 py-3 text-2xl font-bold text-white outline-none"
                        />
                    ) : (
                        <h1 className="text-2xl font-bold text-white">{item.title ?? "(제목 없음)"}</h1>
                    )}
                    <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400">
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <span>번호 {item.sitePopupSeq}</span>
                            <span>목록 노출: {item.showYn === "Y" ? "Y" : "N"}</span>
                            <span>정렬: {item.sortOrder ?? 0}</span>
                            <span>
                                형식: {(item.popupType ?? "MODAL").toUpperCase() === "WINDOW" ? "새 창" : "모달"}{" "}
                                {item.popupWidth ?? 600}×{item.popupHeight ?? 600}
                            </span>
                        </div>
                        <div className="text-slate-300">
                            <span className="text-slate-500">노출 기간 </span>
                            <span className="break-all">{formatPopupPeriodRange(item.popupStartDt, item.popupEndDt)}</span>
                            {item.showYn === "Y" ? (
                                <>
                                    {" "}
                                    <span className="text-slate-500">·</span>{" "}
                                    {isNoticePopupActiveNow({ ...item, popupYn: "Y" }) ? (
                                        <span className="text-violet-300">지금 노출 중</span>
                                    ) : (
                                        <span className="text-slate-500">지금은 노출되지 않음 (기간 전/후)</span>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {editMode ? (
                        <>
                            <button
                                type="button"
                                onClick={onSave}
                                disabled={saving}
                                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                                {saving ? "저장 중..." : "저장"}
                            </button>
                            <Link
                                href={`/site-popups/${sitePopupSeq}`}
                                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100"
                            >
                                취소
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href={`/site-popups/${sitePopupSeq}?mode=edit`}
                                className="rounded-lg border border-sky-600 bg-sky-900/30 px-4 py-2 text-sm font-medium text-sky-200"
                            >
                                수정
                            </Link>
                            <button
                                type="button"
                                onClick={onDelete}
                                className="rounded-lg border border-rose-700 bg-rose-950/40 px-4 py-2 text-sm text-rose-200"
                            >
                                삭제
                            </button>
                            <Link
                                href="/site-popups"
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
                            <div className="space-y-2 rounded-xl border border-violet-900/40 bg-violet-950/20 p-3">
                                <div className="text-sm font-semibold text-violet-100">방식·크기</div>
                                <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="spEditType"
                                            checked={editForm.popupType === "MODAL"}
                                            onChange={() => setEditForm((p) => ({ ...p, popupType: "MODAL" }))}
                                        />
                                        모달
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="spEditType"
                                            checked={editForm.popupType === "WINDOW"}
                                            onChange={() => setEditForm((p) => ({ ...p, popupType: "WINDOW" }))}
                                        />
                                        새 창
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        min={200}
                                        max={2000}
                                        value={editForm.popupWidth}
                                        onChange={(e) => setEditForm((p) => ({ ...p, popupWidth: e.target.value }))}
                                        className="h-9 rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                    />
                                    <input
                                        type="number"
                                        min={200}
                                        max={2000}
                                        value={editForm.popupHeight}
                                        onChange={(e) => setEditForm((p) => ({ ...p, popupHeight: e.target.value }))}
                                        className="h-9 rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="X"
                                        value={editForm.popupPosX}
                                        onChange={(e) => setEditForm((p) => ({ ...p, popupPosX: e.target.value }))}
                                        className="h-9 flex-1 rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Y"
                                        value={editForm.popupPosY}
                                        onChange={(e) => setEditForm((p) => ({ ...p, popupPosY: e.target.value }))}
                                        className="h-9 flex-1 rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                    />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <input
                                        type="datetime-local"
                                        value={editForm.popupStartLocal}
                                        onChange={(e) => setEditForm((p) => ({ ...p, popupStartLocal: e.target.value }))}
                                        className="h-9 rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                    />
                                    <input
                                        type="datetime-local"
                                        value={editForm.popupEndLocal}
                                        onChange={(e) => setEditForm((p) => ({ ...p, popupEndLocal: e.target.value }))}
                                        className="h-9 rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        <BoardEditor
                            value={editForm.content}
                            onChange={(html) => setEditForm((p) => ({ ...p, content: html }))}
                        />
                    </>
                ) : (
                    <div
                        className="prose prose-invert max-w-none break-words text-slate-100"
                        dangerouslySetInnerHTML={{ __html: item.content ?? "" }}
                    />
                )}
            </div>
        </div>
    );
}
