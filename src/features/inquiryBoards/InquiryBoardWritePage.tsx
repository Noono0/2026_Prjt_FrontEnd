"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BoardEditor from "@/components/editor/BoardEditor";
import { createInquiryBoard, fetchInquiryCategories } from "./api";
import type { BoardCategoryOption } from "@/features/boards/types";

export default function InquiryBoardWritePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [categories, setCategories] = useState<BoardCategoryOption[]>([]);
    const [categoryCode, setCategoryCode] = useState("");
    const [anonymous, setAnonymous] = useState(false);
    const [secret, setSecret] = useState(false);
    const [secretPassword, setSecretPassword] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void (async () => {
            try {
                const list = await fetchInquiryCategories();
                setCategories(list);
                if (list.length > 0) {
                    setCategoryCode(list[0].value);
                }
            } catch {
                setCategories([]);
            }
        })();
    }, []);

    const onSubmit = async () => {
        if (!categoryCode) return alert("카테고리를 선택해주세요.");
        if (!title.trim()) return alert("제목을 입력해주세요.");
        if (!content.trim() || content.trim() === "<p></p>") return alert("내용을 입력해주세요.");
        if (secret && !secretPassword.trim()) return alert("비밀글 비밀번호를 입력해주세요.");
        setSaving(true);
        try {
            const n = await createInquiryBoard({
                title,
                content,
                categoryCode,
                showYn: "Y",
                highlightYn: "N",
                commentAllowedYn: "Y",
                replyAllowedYn: "Y",
                anonymousYn: anonymous ? "Y" : "N",
                secretYn: secret ? "Y" : "N",
                secretPassword: secret ? secretPassword : undefined,
            });
            if (n > 0) {
                alert("등록 완료");
                router.push("/inquiry-boards");
            } else {
                alert("등록 실패");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "등록 실패");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-xl border border-slate-800 bg-[#0c1017] p-5 text-slate-100">
            <h1 className="mb-4 text-xl font-bold">문의 작성</h1>
            <div className="mb-3 grid gap-3 lg:grid-cols-[220px_1fr]">
                <select
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                >
                    {categories.length === 0 ? <option value="">카테고리 없음</option> : categories.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                />
            </div>
            <BoardEditor value={content} onChange={setContent} placeholder="문의 내용을 입력하세요." />
            <div className="mt-4 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />익명</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} />비밀글</label>
                {secret ? (
                    <input type="password" value={secretPassword} onChange={(e) => setSecretPassword(e.target.value)} placeholder="비밀번호" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
                ) : null}
            </div>
            <div className="mt-5 flex gap-2">
                <button onClick={() => void onSubmit()} disabled={saving} className="rounded bg-sky-600 px-4 py-2 text-sm">{saving ? "저장 중..." : "등록"}</button>
                <Link href="/inquiry-boards" className="rounded border border-slate-700 px-4 py-2 text-sm">취소</Link>
            </div>
        </div>
    );
}

