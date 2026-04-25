"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BoardEditor from "@/components/editor/BoardEditor";
import type { BoardListItem } from "@/features/boards/types";
import { useAuthStore } from "@/stores/authStore";
import { deleteMyInquiryBoard, fetchInquiryBoardDetail, fetchInquiryCategories, updateInquiryBoard } from "./api";
import type { BoardCategoryOption } from "@/features/boards/types";

type Props = { boardSeq: number };

export default function InquiryBoardDetailPage({ boardSeq }: Props) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [item, setItem] = useState<BoardListItem | null>(null);
    const [categories, setCategories] = useState<BoardCategoryOption[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        categoryCode: "",
        title: "",
        content: "",
        anonymous: false,
        secret: false,
        secretPassword: "",
    });

    const load = useCallback(
        async (pw?: string) => {
            setLoading(true);
            try {
                const detail = await fetchInquiryBoardDetail(boardSeq, pw);
                setItem(detail);
                setEditForm({
                    categoryCode: detail.categoryCode ?? "",
                    title: detail.title ?? "",
                    content: detail.content ?? "",
                    anonymous: detail.anonymousYn === "Y",
                    secret: detail.secretYn === "Y",
                    secretPassword: "",
                });
                setError(null);
            } catch (e) {
                setItem(null);
                setError(e instanceof Error ? e.message : "상세 조회 실패");
            } finally {
                setLoading(false);
            }
        },
        [boardSeq]
    );

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        void (async () => {
            try {
                setCategories(await fetchInquiryCategories());
            } catch {
                setCategories([]);
            }
        })();
    }, []);

    const isOwner =
        typeof user?.memberSeq === "number" &&
        typeof item?.writerMemberSeq === "number" &&
        user.memberSeq === item.writerMemberSeq;

    if (loading) return <div className="p-6 text-slate-300">불러오는 중...</div>;
    if (error && /비밀번호/.test(error)) {
        return (
            <div className="rounded-xl border border-slate-800 bg-[#0c1017] p-5 text-slate-100">
                <h2 className="mb-3 text-lg font-semibold">비밀글</h2>
                <p className="mb-3 text-sm text-slate-400">{error}</p>
                <div className="flex gap-2">
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
                    />
                    <button onClick={() => void load(password)} className="rounded bg-sky-600 px-3 py-2 text-sm">
                        확인
                    </button>
                </div>
            </div>
        );
    }
    if (error) return <div className="p-6 text-amber-300">{error}</div>;
    if (!item) return <div className="p-6 text-slate-400">게시글이 없습니다.</div>;

    const onSave = async () => {
        if (!editForm.categoryCode) return alert("카테고리를 선택해주세요.");
        if (!editForm.title.trim()) return alert("제목을 입력해주세요.");
        if (!editForm.content.trim() || editForm.content.trim() === "<p></p>") return alert("내용을 입력해주세요.");
        if (editForm.secret && !editForm.secretPassword.trim()) {
            return alert("비밀글 비밀번호를 입력해주세요.");
        }
        setSaving(true);
        try {
            const n = await updateInquiryBoard({
                boardSeq,
                categoryCode: editForm.categoryCode,
                title: editForm.title,
                content: editForm.content,
                showYn: item.showYn ?? "Y",
                highlightYn: item.highlightYn ?? "N",
                commentAllowedYn: item.commentAllowedYn ?? "Y",
                replyAllowedYn: item.replyAllowedYn ?? "Y",
                anonymousYn: editForm.anonymous ? "Y" : "N",
                secretYn: editForm.secret ? "Y" : "N",
                secretPassword: editForm.secret ? editForm.secretPassword : undefined,
            });
            if (n > 0) {
                await load(editForm.secret ? editForm.secretPassword : undefined);
                setEditMode(false);
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
        if (!isOwner) return;
        if (!window.confirm("이 글을 삭제할까요?")) return;
        try {
            const n = await deleteMyInquiryBoard(boardSeq);
            if (n > 0) {
                alert("삭제되었습니다.");
                router.push("/inquiry-boards");
            } else {
                alert("삭제할 수 없습니다.");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
        }
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-[#0c1017] p-5 text-slate-100">
            {editMode ? (
                <div className="mb-3 grid gap-3 lg:grid-cols-[220px_1fr]">
                    <select
                        value={editForm.categoryCode}
                        onChange={(e) => setEditForm((p) => ({ ...p, categoryCode: e.target.value }))}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    >
                        {categories.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                    <input
                        value={editForm.title}
                        onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xl font-bold"
                    />
                </div>
            ) : (
                <h1 className="mb-2 text-2xl font-bold">{item.title}</h1>
            )}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                <div>
                    작성자: {item.writerName} · 작성일: {item.createDt}
                </div>
                {isOwner ? (
                    <div className="flex items-center gap-2">
                        {!editMode ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setEditMode(true)}
                                    className="rounded border border-sky-600 bg-sky-900/30 px-3 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-900/50"
                                >
                                    수정
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void onDelete()}
                                    className="rounded border border-rose-700/80 bg-rose-950/40 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-950/70"
                                >
                                    삭제
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => void onSave()}
                                    disabled={saving}
                                    className="rounded bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    {saving ? "저장 중..." : "수정 저장"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditMode(false);
                                        setEditForm({
                                            categoryCode: item.categoryCode ?? "",
                                            title: item.title ?? "",
                                            content: item.content ?? "",
                                            anonymous: item.anonymousYn === "Y",
                                            secret: item.secretYn === "Y",
                                            secretPassword: "",
                                        });
                                    }}
                                    className="rounded border border-slate-700 px-3 py-2 text-sm"
                                >
                                    취소
                                </button>
                            </>
                        )}
                    </div>
                ) : null}
            </div>
            {editMode ? (
                <>
                    <BoardEditor
                        value={editForm.content}
                        onChange={(html) => setEditForm((p) => ({ ...p, content: html }))}
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={editForm.anonymous}
                                onChange={(e) => setEditForm((p) => ({ ...p, anonymous: e.target.checked }))}
                            />
                            익명
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={editForm.secret}
                                onChange={(e) => setEditForm((p) => ({ ...p, secret: e.target.checked }))}
                            />
                            비밀글
                        </label>
                        {editForm.secret ? (
                            <input
                                type="password"
                                value={editForm.secretPassword}
                                onChange={(e) => setEditForm((p) => ({ ...p, secretPassword: e.target.value }))}
                                placeholder="비밀번호"
                                className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                            />
                        ) : null}
                    </div>
                </>
            ) : (
                <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content ?? "" }}
                />
            )}
            <div className="mt-6 flex items-center gap-2">
                <Link href="/inquiry-boards" className="inline-block rounded border border-slate-700 px-3 py-2 text-sm">
                    목록
                </Link>
            </div>
        </div>
    );
}
