"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchEventBattles, createEventBattle, type EventBattleListItem } from "./api";
import { useAuthStore } from "@/stores/authStore";
import { AuthorCellWithMenu } from "@/components/author/AuthorCellWithMenu";
import { EventBattleStatusBadge } from "./EventBattleStatusBadge";
import { z } from "zod";

const MIN_OPTIONS = 2;

const createEventBattleSchema = z.object({
    title: z.string().trim().min(1, "제목을 입력해 주세요."),
    optionLabels: z
        .array(z.string().trim().min(1))
        .min(MIN_OPTIONS, `주제는 ${MIN_OPTIONS}개 이상 입력해 주세요.`),
    voteLimitPerMember: z.number().int().min(1, "투표권은 1 이상이어야 합니다."),
});

export default function EventBattlesPage() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const [items, setItems] = useState<EventBattleListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [voteMode, setVoteMode] = useState(false);
    const [title, setTitle] = useState("");
    const [optionLabels, setOptionLabels] = useState<string[]>(["", ""]);
    const [voteLimitPerMember, setVoteLimitPerMember] = useState(1);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const r = await searchEventBattles({ page: 1, size: 50 });
            setItems(r.items);
        } catch (e) {
            setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const addOption = () => {
        setOptionLabels((prev) => [...prev, ""]);
    };

    const removeOption = (index: number) => {
        setOptionLabels((prev) => {
            if (prev.length <= MIN_OPTIONS) return prev;
            return prev.filter((_, i) => i !== index);
        });
    };

    const updateOption = (index: number, value: string) => {
        setOptionLabels((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleCreate = async () => {
        const labels = optionLabels.map((s) => s.trim()).filter(Boolean);
        const parsed = createEventBattleSchema.safeParse({
            title,
            optionLabels: labels,
            voteLimitPerMember: voteMode ? voteLimitPerMember : 1,
        });
        if (!parsed.success) {
            alert(parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.");
            return;
        }
        try {
            setSaving(true);
            const created = await createEventBattle({
                title: parsed.data.title,
                optionLabels: parsed.data.optionLabels,
                voteLimitPerMember: voteMode ? parsed.data.voteLimitPerMember : 1,
                voteOnly: voteMode,
            });
            const seq = created.eventBattleSeq;
            /* 상세로 갈 때는 모달을 먼저 닫지 않음 — 닫으면 목록이 한 프레임 보였다가 이동함 */
            if (seq != null && seq > 0) {
                router.push(`/event-battles/${seq}`);
                return;
            }
            setOpenCreate(false);
            setTitle("");
            setOptionLabels(["", ""]);
            setVoteLimitPerMember(1);
            await load();
        } catch (e) {
            alert(e instanceof Error ? e.message : "등록 실패");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] p-6 text-slate-100 shadow-xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">이벤트 대결</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        주제 2개 이상 · 회원당 이벤트당 1회 베팅 · 폴링으로 집계 갱신 (Redis는 선택)
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => load()}
                        className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
                        disabled={loading}
                    >
                        {loading ? "새로고침…" : "새로고침"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpenCreate(true)}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
                    >
                        이벤트 만들기
                    </button>
                </div>
            </div>

            {error ? (
                <div className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">{error}</div>
            ) : null}

            {openCreate ? (
                <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-slate-300">새 이벤트 (관리자·스트리머 권한)</div>
                        <button
                            type="button"
                            onClick={() => setVoteMode((v) => !v)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                                voteMode
                                    ? "bg-violet-600 text-white hover:bg-violet-500"
                                    : "border border-slate-600 text-slate-200 hover:bg-slate-800"
                            }`}
                        >
                            투표 모드
                        </button>
                    </div>
                    <label className="mb-4 block">
                        <span className="text-xs text-slate-500">제목</span>
                        <input
                            className="mt-1 w-full rounded border border-slate-700 bg-[#081326] px-3 py-2"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="예: 오늘의 승자는?"
                        />
                    </label>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">
                            주제 ({MIN_OPTIONS}개 이상)
                        </span>
                        <button
                            type="button"
                            onClick={addOption}
                            className="rounded-lg border border-dashed border-slate-600 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
                        >
                            + 주제 추가
                        </button>
                    </div>
                    <div className="space-y-2">
                        {optionLabels.map((lab, idx) => (
                            <div key={idx} className="flex gap-2">
                                <span className="w-8 shrink-0 pt-2 text-center text-xs text-slate-600">{idx + 1}</span>
                                <input
                                    className="flex-1 rounded border border-slate-700 bg-[#081326] px-3 py-2"
                                    value={lab}
                                    onChange={(e) => updateOption(idx, e.target.value)}
                                    placeholder={`주제 ${idx + 1}`}
                                />
                                {optionLabels.length > MIN_OPTIONS ? (
                                    <button
                                        type="button"
                                        className="shrink-0 rounded border border-slate-600 px-2 text-xs text-slate-400 hover:bg-slate-800"
                                        onClick={() => removeOption(idx)}
                                    >
                                        삭제
                                    </button>
                                ) : (
                                    <span className="w-12 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                    {voteMode ? (
                        <label className="mt-3 block">
                            <span className="text-xs text-slate-500">1인당 투표권(기본 1)</span>
                            <input
                                type="number"
                                min={1}
                                className="mt-1 w-full rounded border border-slate-700 bg-[#081326] px-3 py-2"
                                value={voteLimitPerMember}
                                onChange={(e) => setVoteLimitPerMember(Math.max(1, Number(e.target.value || 1)))}
                            />
                        </label>
                    ) : null}
                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={saving}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                            {saving ? "저장…" : "등록"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpenCreate(false)}
                            className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
                        >
                            취소
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                            <th className="px-4 py-3">제목</th>
                            <th className="px-4 py-3">주제</th>
                            <th className="px-4 py-3">상태</th>
                            <th className="px-4 py-3">작성자</th>
                            <th className="px-4 py-3">등록</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((row) => {
                            const seq = row.eventBattleSeq;
                            return (
                                <tr key={seq} className="border-b border-slate-800/80 hover:bg-slate-900/40">
                                    <td className="px-4 py-3">
                                        {seq != null ? (
                                            <Link href={`/event-battles/${seq}`} className="text-sky-400 hover:underline">
                                                {row.title}
                                            </Link>
                                        ) : (
                                            row.title
                                        )}
                                    </td>
                                    <td className="max-w-[280px] truncate px-4 py-3 text-xs text-slate-400">
                                        {row.optionLabelsPreview ?? "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <EventBattleStatusBadge status={row.status} />
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        <AuthorCellWithMenu
                                            memberSeq={row.creatorMemberSeq}
                                            memberId={row.creatorMemberId}
                                            nickname={row.creatorDisplayName}
                                            displayName={row.creatorDisplayName}
                                            profileImageUrl={row.creatorProfileImageUrl}
                                            currentMemberSeq={user?.memberSeq}
                                            variant="compact"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{row.createDt}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!loading && items.length === 0 ? (
                    <p className="p-6 text-center text-sm text-slate-500">등록된 이벤트가 없습니다.</p>
                ) : null}
            </div>
        </div>
    );
}
