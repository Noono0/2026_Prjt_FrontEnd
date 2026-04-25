"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import BoardEditor from "@/components/editor/BoardEditor";
import BoardCommentsSection from "@/features/boards/BoardCommentsSection";
import {
    deleteMyBlacklistReport,
    dislikeBlacklistReport,
    fetchBlacklistReportDetail,
    increaseBlacklistReportViewCount,
    likeBlacklistReport,
} from "./api";
import type { BlacklistReportListItem } from "./types";
import { alertIfApiFailed, type ApiEnvelope } from "@/lib/alertApiFailure";
import { defaultApiRequestInit } from "@/lib/http/requestInit";

type Props = { blacklistReportSeq: number };

function formatDate(value?: string): string {
    if (!value) return "-";
    return value;
}

export default function BlacklistReportDetailPage({ blacklistReportSeq }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const [item, setItem] = useState<BlacklistReportListItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState<"like" | "dislike" | "delete" | null>(null);
    const [editForm, setEditForm] = useState({ blacklistTargetId: "", title: "", content: "" });

    const isOwner =
        typeof user?.memberSeq === "number" &&
        typeof item?.writerMemberSeq === "number" &&
        user.memberSeq === item.writerMemberSeq;
    const editMode = searchParams.get("mode") === "edit" && isOwner;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const detail = await fetchBlacklistReportDetail(blacklistReportSeq);
                const viewedKey = `bl-viewed-${blacklistReportSeq}`;
                if (typeof window !== "undefined" && !sessionStorage.getItem(viewedKey)) {
                    await increaseBlacklistReportViewCount(blacklistReportSeq);
                    sessionStorage.setItem(viewedKey, "Y");
                }
                setItem(detail);
                setEditForm({
                    blacklistTargetId: detail.blacklistTargetId ?? "",
                    title: detail.title ?? "",
                    content: detail.content ?? "",
                });
            } catch (e) {
                setItem(null);
                setError(e instanceof Error ? e.message : "상세를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [blacklistReportSeq]);

    async function onSaveEdit() {
        if (!editForm.blacklistTargetId.trim()) {
            alert("블랙리스트 아이디를 입력해주세요.");
            return;
        }
        if (!editForm.title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        setSaving(true);
        const res = await fetch("/api/blacklist-reports/update", {
            ...defaultApiRequestInit,
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                blacklistReportSeq,
                blacklistTargetId: editForm.blacklistTargetId.trim(),
                title: editForm.title.trim(),
                content: editForm.content,
            }),
        });
        let json: ApiEnvelope | null = null;
        try {
            json = (await res.json()) as ApiEnvelope;
        } catch {
            json = null;
        }
        if (alertIfApiFailed(res, json, "수정 실패")) {
            setSaving(false);
            return;
        }
        alert("수정되었습니다.");
        setSaving(false);
        router.replace(`/blacklist-report/${blacklistReportSeq}`);
        router.refresh();
        setItem((prev) =>
            prev
                ? {
                      ...prev,
                      blacklistTargetId: editForm.blacklistTargetId.trim(),
                      title: editForm.title.trim(),
                      content: editForm.content,
                  }
                : prev
        );
    }

    async function onDelete() {
        if (!confirm("삭제하시겠습니까?")) return;
        setActionLoading("delete");
        try {
            await deleteMyBlacklistReport(blacklistReportSeq);
            alert("삭제되었습니다.");
            router.push("/blacklist-report");
        } catch (e) {
            alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
        } finally {
            setActionLoading(null);
        }
    }

    async function onLike() {
        setActionLoading("like");
        try {
            const changed = await likeBlacklistReport(blacklistReportSeq);
            if (changed > 0) {
                setItem((prev) => (prev ? { ...prev, likeCount: (prev.likeCount ?? 0) + 1 } : prev));
            } else {
                alert("이미 추천한 글입니다.");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "추천 처리에 실패했습니다.");
        } finally {
            setActionLoading(null);
        }
    }

    async function onDislike() {
        setActionLoading("dislike");
        try {
            const changed = await dislikeBlacklistReport(blacklistReportSeq);
            if (changed > 0) {
                setItem((prev) => (prev ? { ...prev, dislikeCount: (prev.dislikeCount ?? 0) + 1 } : prev));
            } else {
                alert("이미 비추천한 글입니다.");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "비추천 처리에 실패했습니다.");
        } finally {
            setActionLoading(null);
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-[#0c1017] px-5 py-16 text-center text-slate-500">
                불러오는 중…
            </div>
        );
    }
    if (error || !item) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-[#0c1017] px-5 py-16 text-center text-amber-200">
                {error ?? "글을 찾을 수 없습니다."}
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="border-b border-slate-800 px-5 py-6">
                <div className="mb-2 text-xs font-medium text-amber-200/90">블랙리스트 아이디 (제보 대상)</div>
                {editMode ? (
                    <input
                        value={editForm.blacklistTargetId}
                        onChange={(e) => setEditForm((p) => ({ ...p, blacklistTargetId: e.target.value }))}
                        className="mb-4 w-full max-w-xl rounded-lg border border-slate-700 bg-[#081326] px-4 py-2 text-sm text-amber-100 outline-none focus:border-sky-600"
                    />
                ) : (
                    <p className="mb-4 text-lg font-semibold text-amber-200">{item.blacklistTargetId ?? "—"}</p>
                )}
                {editMode ? (
                    <input
                        value={editForm.title}
                        onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-[#081326] px-4 py-3 text-2xl font-bold text-white outline-none"
                    />
                ) : (
                    <h1 className="text-2xl font-bold text-white">{item.title ?? "(제목 없음)"}</h1>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
                    <span>카테고리: {item.categoryName ?? item.categoryCode ?? "-"}</span>
                    <span>작성자: {item.writerName ?? "-"}</span>
                    <span>작성일: {formatDate(item.createDt)}</span>
                    <span>조회: {item.viewCount ?? 0}</span>
                    <span>추천: {item.likeCount ?? 0}</span>
                    <span>비추천: {item.dislikeCount ?? 0}</span>
                </div>
            </div>

            <div className="px-5 py-6">
                {editMode ? (
                    <BoardEditor
                        value={editForm.content}
                        onChange={(html) => setEditForm((p) => ({ ...p, content: html }))}
                    />
                ) : (
                    <div
                        className="board-detail-content prose prose-invert max-w-none break-words text-slate-100"
                        dangerouslySetInnerHTML={{ __html: item.content ?? "" }}
                    />
                )}
            </div>

            <div className="border-t border-slate-800 px-5 py-6">
                {editMode ? (
                    <div className="mb-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => void onSaveEdit()}
                            disabled={saving || actionLoading !== null}
                            className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                        >
                            {saving ? "저장 중…" : "저장"}
                        </button>
                        <Link
                            href={`/blacklist-report/${blacklistReportSeq}`}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
                        >
                            취소
                        </Link>
                        {isOwner && (
                            <button
                                type="button"
                                onClick={() => void onDelete()}
                                disabled={saving || actionLoading !== null}
                                className="rounded-lg border border-rose-700/80 bg-rose-950/40 px-4 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-950/70 disabled:opacity-60"
                            >
                                삭제
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => void onLike()}
                            disabled={actionLoading !== null}
                            className="min-w-[120px] rounded-lg border-2 border-slate-200 bg-[#101a2c] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-60"
                        >
                            죽이시오~!👍 ({item.likeCount ?? 0})
                        </button>
                        <button
                            type="button"
                            onClick={() => void onDislike()}
                            disabled={actionLoading !== null}
                            className="min-w-[120px] rounded-lg border-2 border-slate-200 bg-[#101a2c] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-300 disabled:opacity-60"
                        >
                            아직이오~!👎 ({item.dislikeCount ?? 0})
                        </button>
                        {isOwner && (
                            <>
                                <Link
                                    href={`/blacklist-report/${blacklistReportSeq}?mode=edit`}
                                    className="rounded-lg border border-sky-600 bg-sky-900/30 px-4 py-3 text-sm font-semibold text-sky-200 hover:bg-sky-900/50"
                                >
                                    수정
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => void onDelete()}
                                    disabled={actionLoading !== null}
                                    className="rounded-lg border border-rose-700/80 bg-rose-950/40 px-4 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-950/70 disabled:opacity-60"
                                >
                                    삭제
                                </button>
                            </>
                        )}
                    </div>
                )}

                {!editMode ? (
                    <BoardCommentsSection
                        boardSeq={blacklistReportSeq}
                        commentTarget="blacklist"
                        commentAllowedYn={item.commentAllowedYn}
                        replyAllowedYn={item.replyAllowedYn}
                    />
                ) : null}

                <div className="flex justify-center">
                    <Link
                        href="/blacklist-report"
                        className="inline-flex rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                    >
                        목록
                    </Link>
                </div>
            </div>
        </div>
    );
}
