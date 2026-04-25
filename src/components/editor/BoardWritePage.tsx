"use client";

/**
 * 자유게시판 — Create(등록) 전용 화면. (`/boards/write`)
 *
 * [흐름]
 * 1) 마운트 시 `fetchBoardCategories()` 로 카테고리 목록 (api.ts)
 * 2) 사용자가 제목/본문 입력 후 `handleSubmit`
 * 3) `POST /api/boards/create` — 다른 CRUD는 `features/boards/api.ts`를 쓰지만,
 *    등록만 이 파일에서 `fetch` 직접 호출 (응답은 동일하게 success/data)
 * 4) 성공 시 `router.push("/boards")` 로 목록으로 이동
 *
 * 자세한 전체 도식: `features/boards/CRUD_FLOW.md`
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { devLog } from "@/lib/devLog";
import BoardEditor from "./BoardEditor";
import { fetchBoardCategories } from "@/features/boards/api";
import type { BoardCategoryOption } from "@/features/boards/types";
import { alertIfApiFailed, type ApiEnvelope } from "@/lib/alertApiFailure";
import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { bumpWalletRefresh } from "@/stores/walletRefreshStore";

export default function BoardWritePage() {
    const router = useRouter();
    const [categories, setCategories] = useState<BoardCategoryOption[]>([]);
    const [categoryCode, setCategoryCode] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tagDraft, setTagDraft] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [commentAllowed, setCommentAllowed] = useState(true);
    const [replyAllowed, setReplyAllowed] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const list = await fetchBoardCategories();
                setCategories(list);
                if (list.length > 0) {
                    const free = list.find((c) => String(c.value).trim().toUpperCase() === "FREE") ?? list[0];
                    setCategoryCode(free.value);
                }
            } catch {
                setCategories([]);
            }
        };
        void loadCategories();
    }, []);

    function addTagsFromDraft() {
        const raw = tagDraft
            .split(/[\s,]+/g)
            .map((t) => t.trim())
            .filter(Boolean);

        if (raw.length === 0) return;

        setTags((prev) => {
            const next = [...prev];
            for (const t of raw) {
                if (next.length >= 10) break;
                if (!next.includes(t)) next.push(t);
            }
            return next;
        });
        setTagDraft("");
    }

    function removeTag(tag: string) {
        setTags((prev) => prev.filter((t) => t !== tag));
    }

    async function handleSubmit() {
        if (!categoryCode) {
            alert("카테고리를 선택해주세요.");
            return;
        }
        if (!title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        if (!content.trim() || content.trim() === "<p></p>") {
            alert("내용을 입력해주세요.");
            return;
        }

        setSubmitting(true);
        // debugger; // ← 등록 요청 직전에 멈추고 Network 탭과 비교해 보기
        const body = {
            title,
            content, // HTML 문자열
            categoryCode,
            showYn: "Y",
            highlightYn: "N",
            commentAllowedYn: commentAllowed ? "Y" : "N",
            replyAllowedYn: replyAllowed ? "Y" : "N",
        };
        devLog("자유게시판 작성", "POST /api/boards/create", body);
        const res = await fetch("/api/boards/create", {
            ...defaultApiRequestInit,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
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

        bumpWalletRefresh();
        alert("등록 완료");
        setSubmitting(false);
        router.push("/boards");
    }

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">글 작성</h1>
                    <p className="mt-1 text-sm text-slate-500">새 게시글을 작성합니다.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/boards"
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

            <div className="space-y-4 px-5 py-5">
                <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
                    <div>
                        <div className="mb-2 text-xs font-medium text-slate-500">분류</div>
                        <select
                            value={categoryCode}
                            onChange={(e) => setCategoryCode(e.target.value)}
                            className="h-12 w-full rounded-xl border border-slate-700 bg-[#081326] px-4 text-slate-100 outline-none focus:border-sky-600"
                        >
                            {categories.length === 0 ? (
                                <option value="">카테고리 없음</option>
                            ) : (
                                categories.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))
                            )}
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

                <div className="grid gap-4 rounded-2xl border border-slate-800 bg-[#0b1526] p-4 lg:grid-cols-2">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-200">태그</div>
                            <div className="text-xs text-slate-500">{tags.length}/10</div>
                        </div>

                        <input
                            value={tagDraft}
                            onChange={(e) => setTagDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTagsFromDraft();
                                }
                            }}
                            onBlur={addTagsFromDraft}
                            placeholder="태그"
                            className="h-11 w-full rounded-xl border border-slate-700 bg-[#081326] px-4 text-slate-100 outline-none focus:border-sky-600"
                        />

                        {tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {tags.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => removeTag(t)}
                                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                                        title="클릭해서 삭제"
                                    >
                                        #{t}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">
                                태그는 10개까지 입력 가능하며, 띄어쓰기/쉼표로 구분합니다.
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="text-sm font-semibold text-slate-200">댓글 허용 설정</div>
                            <div className="mt-2 flex items-center gap-5 text-sm text-slate-300">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="commentAllowed"
                                        checked={commentAllowed}
                                        onChange={() => setCommentAllowed(true)}
                                    />
                                    허용
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="commentAllowed"
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

                        <div className={commentAllowed ? "" : "pointer-events-none opacity-50"}>
                            <div className="text-sm font-semibold text-slate-200">답글 허용</div>
                            <div className="mt-2 flex items-center gap-5 text-sm text-slate-300">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="replyAllowed"
                                        checked={replyAllowed}
                                        disabled={!commentAllowed}
                                        onChange={() => setReplyAllowed(true)}
                                    />
                                    허용
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="replyAllowed"
                                        checked={!replyAllowed}
                                        disabled={!commentAllowed}
                                        onChange={() => setReplyAllowed(false)}
                                    />
                                    허용 안함
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
