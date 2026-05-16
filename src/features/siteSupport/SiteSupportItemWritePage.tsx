"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BoardEditor from "@/components/editor/BoardEditor";
import { createSiteSupport } from "./api";
import { SUPPORT_CATEGORY_OPTIONS } from "./labels";
import type { SiteSupportCategoryCode } from "./types";
import { sonner } from "@/lib/sonner";

function isEmptyBoardHtml(html: string): boolean {
    const t = html.trim();
    if (!t || t === "<p></p>") return true;
    const plain = t
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .trim();
    return plain.length === 0 && !t.toLowerCase().includes("<img");
}

export default function SiteSupportItemWritePage() {
    const router = useRouter();
    const [categoryCode, setCategoryCode] = useState<SiteSupportCategoryCode>("AD");
    const [title, setTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [content, setContent] = useState("");
    const [showYn, setShowYn] = useState(true);
    const [sortOrder, setSortOrder] = useState("0");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
        if (!title.trim()) {
            sonner.warning("제목을 입력해주세요.");
            return;
        }
        if (isEmptyBoardHtml(content)) {
            sonner.warning("내용을 입력해주세요.");
            return;
        }
        const so = Math.max(0, parseInt(sortOrder, 10) || 0);
        setSubmitting(true);
        try {
            const n = await createSiteSupport({
                categoryCode,
                title: title.trim(),
                content,
                linkUrl: linkUrl.trim() || null,
                showYn: showYn ? "Y" : "N",
                sortOrder: so,
            });
            if (n > 0) {
                sonner.success("등록 완료");
                router.push("/admin/support-items");
            } else {
                sonner.error("등록 실패");
            }
        } catch (e) {
            sonner.error(e instanceof Error ? e.message : "등록 실패");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">서포트 콘텐츠 등록</h1>
                    <p className="mt-1 text-sm text-slate-500">사용자 서포트 메뉴에 카드 형태로 노출됩니다.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/support-items"
                        className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                    >
                        목록
                    </Link>
                    <button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={submitting}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
                    >
                        등록
                    </button>
                </div>
            </div>

            <div className="border-b border-slate-800 px-5 py-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-slate-200">분류</div>
                        <select
                            value={categoryCode}
                            onChange={(e) => setCategoryCode(e.target.value as SiteSupportCategoryCode)}
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                        >
                            {SUPPORT_CATEGORY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-slate-200">목록 노출</div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                            <label className="flex items-center gap-2">
                                <input type="radio" checked={showYn} onChange={() => setShowYn(true)} />
                                표시
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" checked={!showYn} onChange={() => setShowYn(false)} />
                                숨김
                            </label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-slate-200">정렬 순서</div>
                        <input
                            type="number"
                            min={0}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                        />
                        <p className="text-xs text-slate-500">같은 분류 안에서 낮을수록 먼저 나옵니다.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 px-5 py-5">
                <div>
                    <div className="mb-2 text-xs font-medium text-slate-500">제목</div>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, 500))}
                        maxLength={500}
                        placeholder="제목"
                        className="h-12 w-full rounded-xl border border-slate-700 bg-[#081326] px-4 text-slate-100 outline-none focus:border-sky-600"
                    />
                </div>
                <div>
                    <div className="mb-2 text-xs font-medium text-slate-500">바로가기 링크 (선택)</div>
                    <input
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="h-11 w-full rounded-xl border border-slate-700 bg-[#081326] px-4 text-sm text-slate-100 outline-none focus:border-sky-600"
                    />
                </div>
                <div>
                    <div className="mb-2 text-xs font-medium text-slate-500">내용 · 영상 링크 붙여넣기 지원</div>
                    <BoardEditor value={content} onChange={setContent} disabled={false} videoPasteEnabled />
                </div>
            </div>
        </div>
    );
}
