"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BoardEditor from "@/components/editor/BoardEditor";
import { alertIfApiFailed, type ApiEnvelope } from "@/lib/alertApiFailure";
import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { type BlacklistCategoryOption, fetchBlacklistCategories } from "./api";

export default function BlacklistReportWritePage() {
    const router = useRouter();
    const [categories, setCategories] = useState<BlacklistCategoryOption[]>([]);
    const [categoryCode, setCategoryCode] = useState("");
    const [commentAllowed, setCommentAllowed] = useState(true);
    const [replyAllowed, setReplyAllowed] = useState(true);
    const [blacklistTargetId, setBlacklistTargetId] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        void (async () => {
            try {
                setCategories(await fetchBlacklistCategories());
            } catch {
                setCategories([]);
            }
        })();
    }, []);

    async function handleSubmit(): Promise<void> {
        if (!blacklistTargetId.trim()) {
            alert("블랙리스트 아이디를 입력해주세요.");
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
        const res = await fetch("/api/blacklist-reports/create", {
            ...defaultApiRequestInit,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                blacklistTargetId: blacklistTargetId.trim(),
                title: title.trim(),
                content,
                ...(categoryCode.trim() ? { categoryCode: categoryCode.trim() } : {}),
                commentAllowedYn: commentAllowed ? "Y" : "N",
                replyAllowedYn: replyAllowed ? "Y" : "N",
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
        router.push("/blacklist-report");
    }

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">블랙리스트 제보 작성</h1>
                    <p className="mt-1 text-sm text-slate-500">제보 대상 아이디를 입력한 뒤 내용을 작성합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/blacklist-report"
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
                <div>
                    <div className="mb-2 text-xs font-medium text-slate-500">카테고리</div>
                    <select
                        value={categoryCode}
                        onChange={(e) => setCategoryCode(e.target.value)}
                        className="h-12 w-full max-w-xl rounded-xl border border-slate-700 bg-[#081326] px-4 text-slate-100 outline-none focus:border-sky-600"
                    >
                        <option value="">선택 안 함</option>
                        {categories.map((c) => (
                            <option key={`${c.value}-${c.label}`} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <div className="mb-2 text-xs font-medium text-slate-500">블랙리스트 아이디 (제보 대상)</div>
                    <input
                        value={blacklistTargetId}
                        onChange={(e) => setBlacklistTargetId(e.target.value)}
                        placeholder="제보하려는 계정/아이디"
                        className="h-12 w-full max-w-xl rounded-xl border border-slate-700 bg-[#081326] px-4 text-slate-100 outline-none focus:border-sky-600"
                        autoComplete="off"
                    />
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

                <div className="flex flex-wrap gap-6 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={commentAllowed}
                            onChange={(e) => {
                                setCommentAllowed(e.target.checked);
                                if (!e.target.checked) setReplyAllowed(false);
                            }}
                            className="rounded border-slate-600 text-sky-600"
                        />
                        댓글 허용
                    </label>
                    <label
                        className={`flex items-center gap-2 text-sm ${
                            commentAllowed ? "cursor-pointer text-slate-300" : "cursor-not-allowed text-slate-600"
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={replyAllowed}
                            disabled={!commentAllowed}
                            onChange={(e) => setReplyAllowed(e.target.checked)}
                            className="rounded border-slate-600 text-sky-600"
                        />
                        답글 허용
                    </label>
                </div>

                <BoardEditor value={content} onChange={setContent} />
            </div>
        </div>
    );
}
