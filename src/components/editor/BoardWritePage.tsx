"use client";

import { useState } from "react";
import Link from "next/link";
import BoardEditor from "./BoardEditor";

export default function BoardWritePage() {
  const [categoryCode, setCategoryCode] = useState("CHAT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [commentAllowed, setCommentAllowed] = useState(true);
  const [replyAllowed, setReplyAllowed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!content.trim() || content.trim() === "<p></p>") {
      alert("내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/boards/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content, // HTML 문자열
        categoryCode,
        showYn: "Y",
        highlightYn: "N",
      }),
    });

    if (!res.ok) {
      alert("등록 실패");
      setSubmitting(false);
      return;
    }

    alert("등록 완료");
    setSubmitting(false);
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
              <option value="CHAT">잡담</option>
              <option value="STOCK">주식/코인</option>
              <option value="INFO">정보</option>
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
                    onChange={() => setCommentAllowed(false)}
                  />
                  허용 안함
                </label>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-200">답글 허용</div>
              <div className="mt-2 flex items-center gap-5 text-sm text-slate-300">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="replyAllowed"
                    checked={replyAllowed}
                    onChange={() => setReplyAllowed(true)}
                  />
                  허용
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="replyAllowed"
                    checked={!replyAllowed}
                    onChange={() => setReplyAllowed(false)}
                  />
                  허용 안함
                </label>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              현재 댓글/답글 허용값은 화면용 상태로만 유지됩니다. 백엔드 저장이 필요하면 컬럼/DTO/API를 추가로 연결하면 됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

