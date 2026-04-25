"use client";
/* eslint-disable @next/next/no-img-element */

/**
 * 자유게시판 — 상세 (`/boards/[boardSeq]`)
 *
 * [Read]
 * - `fetchBoardDetail(boardSeq)` → GET `/api/boards/detail/:id`
 * - `increaseBoardViewCount` — 탭당 한 번 조회수 반영(sessionStorage 키로 중복 방지)
 *
 * [Update]
 * - URL에 `?mode=edit` 이고 로그인 사용자가 작성자일 때 편집 폼
 * - 저장 시 `updateBoard` → PUT `/api/boards/update`
 *
 * [Delete]
 * - `deleteMyBoard` → DELETE `/api/boards/mine/:id`
 *
 * 전체 CRUD 위치: `CRUD_FLOW.md` (같은 features/boards 폴더)
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { devLog } from "@/lib/devLog";
import { useAuthStore } from "@/stores/authStore";
import BoardEditor from "@/components/editor/BoardEditor";
import {
    deleteMyBoard,
    dislikeBoard,
    fetchBoardCategories,
    fetchBoardDetail,
    increaseBoardViewCount,
    likeBoard,
    reportBoard,
    updateBoard,
} from "./api";
import BoardCommentsSection from "./BoardCommentsSection";
import type { BoardCategoryOption, BoardListItem } from "./types";
import styles from "./BoardDetailPage.module.css";

type Props = {
    boardSeq: number;
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

export default function BoardDetailPage({ boardSeq }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const [item, setItem] = useState<BoardListItem | null>(null);
    const [categories, setCategories] = useState<BoardCategoryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<"like" | "dislike" | "report" | "delete" | null>(null);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        title: "",
        content: "",
        categoryCode: "",
        commentAllowed: true,
        replyAllowed: true,
    });

    const isOwner =
        typeof user?.memberSeq === "number" &&
        typeof item?.writerMemberSeq === "number" &&
        user.memberSeq === item.writerMemberSeq;
    const editMode = searchParams.get("mode") === "edit" && isOwner;

    useEffect(() => {
        const load = async () => {
            // debugger; // ← 상세 데이터 받기 직전 멈추고 싶을 때 주석 해제
            setLoading(true);
            setError(null);

            try {
                devLog("자유게시판 상세", "boardSeq", boardSeq);
                const detail = await fetchBoardDetail(boardSeq);
                const viewedKey = `board-viewed-${boardSeq}`;
                if (typeof window !== "undefined" && !sessionStorage.getItem(viewedKey)) {
                    await increaseBoardViewCount(boardSeq);
                    sessionStorage.setItem(viewedKey, "Y");
                }
                devLog("자유게시판 상세", "제목", detail.title);
                setItem(detail);
                setEditForm({
                    title: detail.title ?? "",
                    content: detail.content ?? "",
                    categoryCode: detail.categoryCode ?? "",
                    commentAllowed: boardYnAllowed(detail.commentAllowedYn),
                    replyAllowed: boardYnAllowed(detail.replyAllowedYn),
                });
            } catch (e) {
                devLog("자유게시판 상세", "로드 실패", e);
                setItem(null);
                setError(e instanceof Error ? e.message : "상세를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [boardSeq]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setCategories(await fetchBoardCategories());
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
            const changed = await likeBoard(boardSeq);
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
            const changed = await dislikeBoard(boardSeq);
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

    const onDelete = async () => {
        if (!isOwner || !item?.boardSeq) return;
        if (!window.confirm("이 글을 삭제할까요? 삭제된 글은 목록에서 보이지 않습니다.")) return;
        setActionLoading("delete");
        try {
            devLog("자유게시판 삭제", "DELETE mine", boardSeq);
            const n = await deleteMyBoard(boardSeq);
            if (n > 0) {
                alert("삭제되었습니다.");
                router.push("/boards");
            } else {
                alert("삭제할 수 없습니다.");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
        } finally {
            setActionLoading(null);
        }
    };

    const onReport = async () => {
        setActionLoading("report");
        try {
            const changed = await reportBoard(boardSeq);
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
        if (!item?.boardSeq) return;
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
            devLog("자유게시판 수정", "PUT update", { boardSeq: item.boardSeq, title: editForm.title });
            const result = await updateBoard({
                boardSeq: item.boardSeq,
                categoryCode: editForm.categoryCode,
                title: editForm.title,
                content: editForm.content,
                showYn: item.showYn ?? "Y",
                highlightYn: item.highlightYn ?? "N",
                commentAllowedYn: editForm.commentAllowed ? "Y" : "N",
                replyAllowedYn: editForm.replyAllowed ? "Y" : "N",
            });
            if (result > 0) {
                const detail = await fetchBoardDetail(boardSeq);
                setItem(detail);
                setEditForm({
                    title: detail.title ?? "",
                    content: detail.content ?? "",
                    categoryCode: detail.categoryCode ?? "",
                    commentAllowed: boardYnAllowed(detail.commentAllowedYn),
                    replyAllowed: boardYnAllowed(detail.replyAllowedYn),
                });
                router.replace(`/boards/${boardSeq}`);
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
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className={styles.authorMeta}>
                            {item.writerProfileImageUrl ? (
                                <img
                                    src={item.writerProfileImageUrl}
                                    alt="작성자 프로필"
                                    className={styles.authorAvatar}
                                />
                            ) : (
                                <span className={styles.authorFallback}>{(item.writerName ?? "?").slice(0, 1)}</span>
                            )}
                            닉네임: {item.writerName ?? "-"}
                        </span>
                        <span>작성일: {formatDate(item.createDt)}</span>
                        <span>조회: {item.viewCount ?? 0}</span>
                        <span>추천: {item.likeCount ?? 0}</span>
                        <span>비추천: {item.dislikeCount ?? 0}</span>
                        <span>신고: {item.reportCount ?? 0}</span>
                    </div>
                    {isOwner && !editMode ? (
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/boards/${boardSeq}?mode=edit`}
                                className="rounded-lg border border-sky-600 bg-sky-900/30 px-4 py-2.5 text-sm font-semibold text-sky-200 hover:bg-sky-900/50"
                            >
                                수정
                            </Link>
                            <button
                                type="button"
                                onClick={() => void onDelete()}
                                disabled={actionLoading !== null}
                                className="rounded-lg border border-rose-700/80 bg-rose-950/40 px-4 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-950/70 disabled:opacity-60"
                            >
                                삭제
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="px-5 py-6">
                {editMode ? (
                    <>
                        <BoardEditor
                            value={editForm.content}
                            onChange={(html) => setEditForm((prev) => ({ ...prev, content: html }))}
                        />
                        <div className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-[#0b1526] p-4 lg:grid-cols-2">
                            <div className="space-y-2">
                                <div className="text-sm font-semibold text-slate-200">댓글 허용 설정</div>
                                <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="detailCommentAllowed"
                                            checked={editForm.commentAllowed}
                                            onChange={() => setEditForm((p) => ({ ...p, commentAllowed: true }))}
                                        />
                                        허용
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="detailCommentAllowed"
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
                                className={
                                    editForm.commentAllowed ? "space-y-2" : "pointer-events-none space-y-2 opacity-50"
                                }
                            >
                                <div className="text-sm font-semibold text-slate-200">답글 허용</div>
                                <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="detailReplyAllowed"
                                            checked={editForm.replyAllowed}
                                            disabled={!editForm.commentAllowed}
                                            onChange={() => setEditForm((p) => ({ ...p, replyAllowed: true }))}
                                        />
                                        허용
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="detailReplyAllowed"
                                            checked={!editForm.replyAllowed}
                                            disabled={!editForm.commentAllowed}
                                            onChange={() => setEditForm((p) => ({ ...p, replyAllowed: false }))}
                                        />
                                        허용 안함
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
                            disabled={saving || actionLoading !== null}
                            className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                        >
                            {saving ? "저장 중..." : "수정 저장"}
                        </button>
                        <Link
                            href={`/boards/${boardSeq}`}
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
                    </div>
                )}

                <BoardCommentsSection
                    boardSeq={boardSeq}
                    commentAllowedYn={item.commentAllowedYn}
                    replyAllowedYn={item.replyAllowedYn}
                />

                <Link
                    href="/boards"
                    className="mt-6 inline-flex rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                    목록
                </Link>
            </div>
        </div>
    );
}
