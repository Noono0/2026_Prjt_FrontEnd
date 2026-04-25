"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import BoardEditor from "@/components/editor/BoardEditor";
import BoardCommentsSection from "@/features/boards/BoardCommentsSection";
import {
    dislikeNoticeBoard,
    fetchNoticeBoardCategories,
    fetchNoticeBoardDetail,
    increaseNoticeBoardViewCount,
    likeNoticeBoard,
    reportNoticeBoard,
    updateNoticeBoard,
} from "./api";
import type { NoticeBoardCategoryOption, NoticeBoardListItem } from "./types";
import styles from "./NoticeBoardDetailPage.module.css";

type Props = {
    noticeBoardSeq: number;
};

function formatDate(value?: string): string {
    if (!value) return "-";
    return value;
}

function isEmptyBoardHtml(html: string): boolean {
    const t = html.trim();
    if (!t || t === "<p></p>") return true;
    const plain = t
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .trim();
    return plain.length === 0 && !t.toLowerCase().includes("<img");
}

function boardYnAllowed(v?: string): boolean {
    if (v == null || v === "") return true;
    return v.trim().toUpperCase() === "Y";
}

export default function NoticeBoardDetailPage({ noticeBoardSeq }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const [item, setItem] = useState<NoticeBoardListItem | null>(null);
    const [categories, setCategories] = useState<NoticeBoardCategoryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<"like" | "dislike" | "report" | null>(null);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        title: "",
        content: "",
        categoryCode: "",
        commentAllowed: true,
        replyAllowed: true,
        pinOnFreeBoard: false,
    });

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
                const viewedKey = `notice-board-viewed-${noticeBoardSeq}`;
                if (typeof window !== "undefined" && !sessionStorage.getItem(viewedKey)) {
                    await increaseNoticeBoardViewCount(noticeBoardSeq);
                    sessionStorage.setItem(viewedKey, "Y");
                }
                const detail = await fetchNoticeBoardDetail(noticeBoardSeq);
                setItem(detail);
                setEditForm({
                    title: detail.title ?? "",
                    content: detail.content ?? "",
                    categoryCode: detail.categoryCode ?? "",
                    commentAllowed: boardYnAllowed(detail.commentAllowedYn),
                    replyAllowed: boardYnAllowed(detail.replyAllowedYn),
                    pinOnFreeBoard: boardYnAllowed(detail.pinOnFreeBoardYn),
                });
            } catch (e) {
                setItem(null);
                setError(e instanceof Error ? e.message : "상세를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [noticeBoardSeq]);

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

    if (loading) {
        return (
            <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] px-5 py-10 text-center text-slate-400">
                불러오는 중...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] px-5 py-10 text-center text-amber-300">
                {error}
            </div>
        );
    }

    if (!item) {
        return (
            <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] px-5 py-10 text-center text-slate-400">
                게시글이 없습니다.
            </div>
        );
    }

    const onLike = async () => {
        setActionLoading("like");
        try {
            const changed = await likeNoticeBoard(noticeBoardSeq);
            if (changed > 0) {
                setItem((prev) => (prev ? { ...prev, likeCount: (prev.likeCount ?? 0) + 1 } : prev));
            } else {
                alert("이미 좋아요 처리된 게시글입니다.");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "좋아요 처리에 실패했습니다.");
        } finally {
            setActionLoading(null);
        }
    };

    const onDislike = async () => {
        setActionLoading("dislike");
        try {
            const changed = await dislikeNoticeBoard(noticeBoardSeq);
            if (changed > 0) {
                setItem((prev) => (prev ? { ...prev, dislikeCount: (prev.dislikeCount ?? 0) + 1 } : prev));
            } else {
                alert("이미 싫어요 처리된 게시글입니다.");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "싫어요 처리에 실패했습니다.");
        } finally {
            setActionLoading(null);
        }
    };

    const onReport = async () => {
        setActionLoading("report");
        try {
            const changed = await reportNoticeBoard(noticeBoardSeq);
            if (changed > 0) {
                setItem((prev) => (prev ? { ...prev, reportCount: (prev.reportCount ?? 0) + 1 } : prev));
                alert("신고가 접수되었습니다.");
            } else {
                alert("이미 신고 처리된 게시글입니다.");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "신고 처리에 실패했습니다.");
        } finally {
            setActionLoading(null);
        }
    };

    const onSaveEdit = async () => {
        if (!item?.noticeBoardSeq) return;
        if (!editForm.title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        if (isEmptyBoardHtml(editForm.content)) {
            alert("내용을 입력해주세요.");
            return;
        }

        setSaving(true);
        try {
            const result = await updateNoticeBoard({
                noticeBoardSeq: item.noticeBoardSeq,
                categoryCode: editForm.categoryCode || undefined,
                title: editForm.title,
                content: editForm.content,
                showYn: item.showYn ?? "Y",
                highlightYn: item.highlightYn ?? "N",
                commentAllowedYn: editForm.commentAllowed ? "Y" : "N",
                replyAllowedYn: editForm.replyAllowed ? "Y" : "N",
                pinOnFreeBoardYn: editForm.pinOnFreeBoard ? "Y" : "N",
            });
            if (result > 0) {
                const detail = await fetchNoticeBoardDetail(noticeBoardSeq);
                setItem(detail);
                setEditForm({
                    title: detail.title ?? "",
                    content: detail.content ?? "",
                    categoryCode: detail.categoryCode ?? "",
                    commentAllowed: boardYnAllowed(detail.commentAllowedYn),
                    replyAllowed: boardYnAllowed(detail.replyAllowedYn),
                    pinOnFreeBoard: boardYnAllowed(detail.pinOnFreeBoardYn),
                });
                router.replace(`/notice-board/${noticeBoardSeq}`);
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

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="border-b border-slate-800 px-5 py-4">
                <div className="mb-2 text-sm text-slate-400">
                    {editMode ? (
                        <select
                            value={editForm.categoryCode}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, categoryCode: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-[#081326] px-3 py-2 text-sm text-slate-100"
                        >
                            {categories.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        (item.categoryName ?? item.categoryCode ?? "-")
                    )}
                </div>
                {editMode ? (
                    <input
                        value={editForm.title}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-[#081326] px-4 py-3 text-2xl font-bold text-white outline-none"
                    />
                ) : (
                    <h1 className="text-2xl font-bold text-white">{item.title ?? "(제목 없음)"}</h1>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
                    <span className={styles.authorMeta}>
                        {item.writerProfileImageUrl ? (
                            <img src={item.writerProfileImageUrl} alt="작성자 프로필" className={styles.authorAvatar} />
                        ) : (
                            <span className={styles.authorFallback}>{(item.writerName ?? "?").slice(0, 1)}</span>
                        )}
                        작성자: {item.writerName ?? "-"}
                    </span>
                    <span>작성일: {formatDate(item.createDt)}</span>
                    <span>조회: {item.viewCount ?? 0}</span>
                    <span>추천: {item.likeCount ?? 0}</span>
                    <span>비추천: {item.dislikeCount ?? 0}</span>
                    <span>신고: {item.reportCount ?? 0}</span>
                </div>
            </div>

            <div className="px-5 py-6">
                {editMode ? (
                    <>
                        <BoardEditor
                            value={editForm.content}
                            onChange={(html) => setEditForm((prev) => ({ ...prev, content: html }))}
                        />
                        <div className="mt-6 grid gap-4 lg:grid-cols-3">
                            <div className="space-y-2 rounded-xl border border-slate-800 bg-[#0b1526] p-3">
                                <div className="text-sm font-semibold text-slate-200">댓글 허용</div>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="nbEditComment"
                                            checked={editForm.commentAllowed}
                                            onChange={() => setEditForm((p) => ({ ...p, commentAllowed: true }))}
                                        />
                                        허용
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="nbEditComment"
                                            checked={!editForm.commentAllowed}
                                            onChange={() =>
                                                setEditForm((p) => ({
                                                    ...p,
                                                    commentAllowed: false,
                                                    replyAllowed: false,
                                                }))
                                            }
                                        />
                                        허용 안함
                                    </label>
                                </div>
                            </div>
                            <div
                                className={`space-y-2 rounded-xl border border-slate-800 bg-[#0b1526] p-3 ${
                                    editForm.commentAllowed ? "" : "pointer-events-none opacity-50"
                                }`}
                            >
                                <div className="text-sm font-semibold text-slate-200">답글 허용</div>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="nbEditReply"
                                            checked={editForm.replyAllowed}
                                            disabled={!editForm.commentAllowed}
                                            onChange={() => setEditForm((p) => ({ ...p, replyAllowed: true }))}
                                        />
                                        허용
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="nbEditReply"
                                            checked={!editForm.replyAllowed}
                                            disabled={!editForm.commentAllowed}
                                            onChange={() => setEditForm((p) => ({ ...p, replyAllowed: false }))}
                                        />
                                        허용 안함
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-2 rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
                                <div className="text-sm font-semibold text-amber-100">자유게시판 상단 고정</div>
                                <p className="text-xs text-amber-200/80">
                                    자유게시판 목록 상단에 이 공지를 함께 표시합니다.
                                </p>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="nbEditPin"
                                            checked={editForm.pinOnFreeBoard}
                                            onChange={() => setEditForm((p) => ({ ...p, pinOnFreeBoard: true }))}
                                        />
                                        표시
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="nbEditPin"
                                            checked={!editForm.pinOnFreeBoard}
                                            onChange={() => setEditForm((p) => ({ ...p, pinOnFreeBoard: false }))}
                                        />
                                        표시 안함
                                    </label>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div
                        className="board-detail-content prose prose-invert max-w-none break-words text-slate-100"
                        dangerouslySetInnerHTML={{ __html: item.content ?? "" }}
                    />
                )}
            </div>

            <div className="border-t border-slate-800 px-5 py-6">
                {editMode ? (
                    <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={onSaveEdit}
                            disabled={saving}
                            className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                        >
                            {saving ? "저장 중..." : "수정 저장"}
                        </button>
                        <Link
                            href={`/notice-board/${noticeBoardSeq}`}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
                        >
                            취소
                        </Link>
                    </div>
                ) : (
                    <div className={styles.actions}>
                        <button
                            type="button"
                            onClick={onLike}
                            disabled={actionLoading !== null}
                            className="min-w-[132px] rounded-lg border-2 border-slate-200 bg-[#101a2c] px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-60"
                        >
                            좋아요👍 ({item.likeCount ?? 0})
                        </button>
                        <button
                            type="button"
                            onClick={onDislike}
                            disabled={actionLoading !== null}
                            className="min-w-[132px] rounded-lg border-2 border-slate-200 bg-[#101a2c] px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-300 disabled:opacity-60"
                        >
                            싫어요👎 ({item.dislikeCount ?? 0})
                        </button>
                        <button
                            type="button"
                            onClick={onReport}
                            disabled={actionLoading !== null}
                            className="min-w-[132px] rounded-lg border-2 border-slate-200 bg-[#101a2c] px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-rose-400 hover:text-rose-300 disabled:opacity-60"
                        >
                            신고🚨 ({item.reportCount ?? 0})
                        </button>
                        {isOwner && (
                            <Link
                                href={`/notice-board/${noticeBoardSeq}?mode=edit`}
                                className="rounded-lg border border-sky-600 bg-sky-900/30 px-4 py-3 text-sm font-semibold text-sky-200 hover:bg-sky-900/50"
                            >
                                수정
                            </Link>
                        )}
                    </div>
                )}

                <BoardCommentsSection
                    boardSeq={noticeBoardSeq}
                    commentTarget="notice"
                    commentAllowedYn={item.commentAllowedYn}
                    replyAllowedYn={item.replyAllowedYn}
                />

                <Link
                    href="/notice-board"
                    className="mt-6 inline-flex rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                    목록
                </Link>
            </div>
        </div>
    );
}
