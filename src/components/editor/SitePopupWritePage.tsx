"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BoardEditor from "./BoardEditor";
import { datetimeLocalToApiDateTime } from "@/lib/noticePopupSchedule";
import { createSitePopup } from "@/features/sitePopups/api";

function isEmptyBoardHtml(html: string): boolean {
    const t = html.trim();
    if (!t || t === "<p></p>") return true;
    const plain = t.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();
    return plain.length === 0 && !t.toLowerCase().includes("<img");
}

export default function SitePopupWritePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [showYn, setShowYn] = useState(true);
    const [sortOrder, setSortOrder] = useState("0");
    const [popupType, setPopupType] = useState<"MODAL" | "WINDOW">("MODAL");
    const [popupWidth, setPopupWidth] = useState("600");
    const [popupHeight, setPopupHeight] = useState("600");
    const [popupPosX, setPopupPosX] = useState("");
    const [popupPosY, setPopupPosY] = useState("");
    const [popupStartLocal, setPopupStartLocal] = useState("");
    const [popupEndLocal, setPopupEndLocal] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
        if (!title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        if (isEmptyBoardHtml(content)) {
            alert("내용을 입력해주세요.");
            return;
        }

        const pw = Math.min(2000, Math.max(200, parseInt(popupWidth, 10) || 600));
        const ph = Math.min(2000, Math.max(200, parseInt(popupHeight, 10) || 600));
        const px = popupPosX.trim() === "" ? null : Number(popupPosX);
        const py = popupPosY.trim() === "" ? null : Number(popupPosY);
        const so = Math.max(0, parseInt(sortOrder, 10) || 0);

        setSubmitting(true);
        try {
            const n = await createSitePopup({
                title,
                content,
                showYn: showYn ? "Y" : "N",
                sortOrder: so,
                popupType,
                popupWidth: pw,
                popupHeight: ph,
                popupPosX: px != null && !Number.isNaN(px) ? px : null,
                popupPosY: py != null && !Number.isNaN(py) ? py : null,
                popupStartDt: datetimeLocalToApiDateTime(popupStartLocal),
                popupEndDt: datetimeLocalToApiDateTime(popupEndLocal),
            });
            if (n > 0) {
                alert("등록 완료");
                router.push("/site-popups");
            } else {
                alert("등록 실패");
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "등록 실패");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] text-slate-100 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">팝업 등록</h1>
                    <p className="mt-1 text-sm text-slate-500">사이트 접속 시 표시할 팝업을 만듭니다.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/site-popups"
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
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-2 rounded-xl border border-slate-800 bg-[#0b1526] p-3">
                        <div className="text-sm font-semibold text-slate-200">목록 노출 (show)</div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="spShow" checked={showYn} onChange={() => setShowYn(true)} />
                                표시
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" name="spShow" checked={!showYn} onChange={() => setShowYn(false)} />
                                숨김
                            </label>
                        </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-slate-800 bg-[#0b1526] p-3">
                        <div className="text-sm font-semibold text-slate-200">정렬 순서</div>
                        <input
                            type="number"
                            min={0}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                        />
                        <p className="text-xs text-slate-500">낮을수록 먼저 뜹니다.</p>
                    </div>
                    <div className="space-y-3 rounded-xl border border-violet-900/40 bg-violet-950/20 p-3 lg:col-span-1">
                        <div className="text-sm font-semibold text-violet-100">표시 방식</div>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="spPopupType"
                                    checked={popupType === "MODAL"}
                                    onChange={() => setPopupType("MODAL")}
                                />
                                모달
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="spPopupType"
                                    checked={popupType === "WINDOW"}
                                    onChange={() => setPopupType("WINDOW")}
                                />
                                새 창
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <div className="mb-1 text-xs text-slate-500">가로</div>
                                <input
                                    type="number"
                                    min={200}
                                    max={2000}
                                    value={popupWidth}
                                    onChange={(e) => setPopupWidth(e.target.value)}
                                    className="h-9 w-full rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-xs text-slate-500">세로</div>
                                <input
                                    type="number"
                                    min={200}
                                    max={2000}
                                    value={popupHeight}
                                    onChange={(e) => setPopupHeight(e.target.value)}
                                    className="h-9 w-full rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="mb-1 text-xs text-slate-500">위치 X,Y (비우면 중앙)</div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="X"
                                    value={popupPosX}
                                    onChange={(e) => setPopupPosX(e.target.value)}
                                    className="h-9 flex-1 rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="Y"
                                    value={popupPosY}
                                    onChange={(e) => setPopupPosY(e.target.value)}
                                    className="h-9 flex-1 rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                                <div className="mb-1 text-xs text-slate-500">시작 (비우면 즉시)</div>
                                <input
                                    type="datetime-local"
                                    value={popupStartLocal}
                                    onChange={(e) => setPopupStartLocal(e.target.value)}
                                    className="h-9 w-full rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-xs text-slate-500">종료 (비우면 무제한)</div>
                                <input
                                    type="datetime-local"
                                    value={popupEndLocal}
                                    onChange={(e) => setPopupEndLocal(e.target.value)}
                                    className="h-9 w-full rounded border border-slate-700 bg-[#081326] px-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 px-5 py-5">
                <div>
                    <div className="mb-2 text-xs font-medium text-slate-500">제목</div>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목"
                        className="h-12 w-full rounded-xl border border-slate-700 bg-[#081326] px-4 text-slate-100 outline-none focus:border-sky-600"
                    />
                </div>
                <BoardEditor value={content} onChange={setContent} placeholder="팝업 내용" />
            </div>
        </div>
    );
}
