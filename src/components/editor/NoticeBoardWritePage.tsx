"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BoardEditor from "./BoardEditor";
import { fetchNoticeBoardCategories } from "@/features/noticeBoards/api";
import type { NoticeBoardCategoryOption } from "@/features/noticeBoards/types";
import { alertIfApiFailed, type ApiEnvelope } from "@/lib/alertApiFailure";

function isEmptyBoardHtml(html: string): boolean {
    const t = html.trim();
    if (!t || t === "<p></p>") return true;
    const plain = t.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();
    return plain.length === 0 && !t.toLowerCase().includes("<img");
}

export default function NoticeBoardWritePage() {
    const router = useRouter();
    const [categories, setCategories] = useState<NoticeBoardCategoryOption[]>([]);
    const [categoryCode, setCategoryCode] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [commentAllowed, setCommentAllowed] = useState(true);
    const [replyAllowed, setReplyAllowed] = useState(true);
    const [pinOnFreeBoard, setPinOnFreeBoard] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const list = await fetchNoticeBoardCategories();
                setCategories(list);
                if (list.length > 0) {
                    setCategoryCode(list[0].value);
                }
            } catch {
                setCategories([]);
            }
        };
        void loadCategories();
    }, []);

    async function handleSubmit() {
        if (!title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        if (isEmptyBoardHtml(content)) {
            alert("내용을 입력해주세요.");
            return;
        }

        setSubmitting(true);
        const res = await fetch("/api/notice-boards/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                content,
                categoryCode: categoryCode || undefined,
                showYn: "Y",
                highlightYn: "N",
                commentAllowedYn: commentAllowed ? "Y" : "N",
                replyAllowedYn: replyAllowed ? "Y" : "N",
                pinOnFreeBoardYn: pinOnFreeBoard ? "Y" : "N",
            }),
        });

        let json: ApiEnvelope | null = null;
        try {
            json = (await res.json()) as ApiEnvelope;
        } catch {
            json = null;
        }
        if (alertIfApiFailed(res, json, "등록 실패")) {
            setSubmitting(false);
            return;
        }

        alert("등록 완료");
        setSubmitting(false);
        router.push("/notice-board");
    }

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">공지사항 작성</h1>
                    <p className="mt-1 text-sm text-slate-500">새 공지사항을 작성합니다.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/notice-board"
                        className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                    >
                        목록
                    </Link>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
                    >
                        등록
                    </button>
                </div>
            </div>

            <div className="border-b border-slate-800 px-5 py-4">
                <div className="mb-2 text-xs font-medium text-slate-500">노출·댓글 설정</div>
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-2 rounded-xl border border-slate-800 bg-[#0b1526] p-3">
                        <div className="text-sm font-semibold text-slate-200">댓글 허용</div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="nbCommentAllowed"
                                    checked={commentAllowed}
                                    onChange={() => setCommentAllowed(true)}
                                />
                                허용
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="nbCommentAllowed"
                                    checked={!commentAllowed}
                                    onChange={() => {
                                        setCommentAllowed(false);
                                        setReplyAllowed(false);
                                    }}
                                />
                                허용 안함
                            </label>
                        </div>
                    </div>
                    <div
                        className={`space-y-2 rounded-xl border border-slate-800 bg-[#0b1526] p-3 ${
                            commentAllowed ? "" : "pointer-events-none opacity-50"
                        }`}
                    >
                        <div className="text-sm font-semibold text-slate-200">답글 허용</div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="nbReplyAllowed"
                                    checked={replyAllowed}
                                    disabled={!commentAllowed}
                                    onChange={() => setReplyAllowed(true)}
                                />
                                허용
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="nbReplyAllowed"
                                    checked={!replyAllowed}
                                    disabled={!commentAllowed}
                                    onChange={() => setReplyAllowed(false)}
                                />
                                허용 안함
                            </label>
                        </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
                        <div className="text-sm font-semibold text-amber-100">자유게시판 상단 고정</div>
                        <p className="text-xs text-amber-200/80">
                            켜면 자유게시판 메뉴 목록 상단에 이 공지가 함께 표시됩니다.
                            </p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="nbPinFree"
                                    checked={pinOnFreeBoard}
                                    onChange={() => setPinOnFreeBoard(true)}
                                />
                                표시
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="nbPinFree"
                                    checked={!pinOnFreeBoard}
                                    onChange={() => setPinOnFreeBoard(false)}
                                />
                                표시 안함
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 px-5 py-5">
                <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
                    <div>
                        <div className="mb-2 text-xs font-medium text-slate-500">분류</div>
                        <select
                            value={categoryCode}
                            onChange={(e) => setCategoryCode(e.target.value)}
                            className="h-12 w-full rounded-xl border border-slate-700 bg-[#081326] px-4 text-slate-100 outline-none focus:border-sky-600"
                        >
                            {categories.map((category) => (
                                <option key={category.value} value={category.value}>
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="mb-2 text-xs font-medium text-slate-500">제목</div>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목"
                            className="h-12 w-full rounded-xl border border-slate-700 bg-[#081326] px-4 text-slate-100 outline-none focus:border-sky-600"
                        />
                    </div>
                </div>

                <BoardEditor value={content} onChange={setContent} placeholder="내용을 입력하세요." />
            </div>
        </div>
    );
}
