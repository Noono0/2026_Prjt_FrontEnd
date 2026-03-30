"use client";

import { useEffect, useState } from "react";
import { fetchPointPolicies, savePointPolicies, type PointPolicyRow } from "./api";

const LABELS: Record<string, { title: string; desc: string }> = {
    SIGNUP: {
        title: "회원가입",
        desc: "가입 완료 시 1회 지급되는 포인트입니다.",
    },
    FREE_BOARD_POST: {
        title: "자유게시판 글 작성",
        desc: "자유게시판(설정된 카테고리)에 글을 올릴 때 지급됩니다.",
    },
    BOARD_COMMENT_FIRST: {
        title: "자유게시판 · 게시글당 첫 댓글",
        desc: "해당 글에 본인이 처음 다는 댓글에 대해 지급됩니다.",
    },
    BOARD_COMMENT_EXTRA: {
        title: "자유게시판 · 추가 댓글 적립 상한",
        desc: "첫 댓글 이후 같은 글에서 추가로 적립될 수 있는 포인트 합계 상한(게시글당)입니다.",
    },
    NOTICE_COMMENT_FIRST: {
        title: "공지 · 게시글당 첫 댓글",
        desc: "공지 글에 본인이 처음 다는 댓글에 대해 지급됩니다.",
    },
    NOTICE_COMMENT_EXTRA: {
        title: "공지 · 추가 댓글 적립 상한",
        desc: "첫 댓글 이후 같은 공지에서 추가 적립 합계 상한(공지당)입니다.",
    },
    FREE_BOARD_LIKE: {
        title: "자유게시판 · 추천 마일스톤",
        desc: "추천 수가 기준에 도달하면 글 작성자에게 1회 지급됩니다.",
    },
};

function PolicyCard({
    row,
    onChange,
}: {
    row: PointPolicyRow;
    onChange: (next: PointPolicyRow) => void;
}) {
    const meta = LABELS[row.policyKey] ?? { title: row.policyKey, desc: "" };
    const isExtra = row.policyKey === "BOARD_COMMENT_EXTRA" || row.policyKey === "NOTICE_COMMENT_EXTRA";
    const isLike = row.policyKey === "FREE_BOARD_LIKE";

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-white">{meta.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{meta.desc}</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <input
                        type="checkbox"
                        checked={row.useYn === "Y"}
                        onChange={(e) => onChange({ ...row, useYn: e.target.checked ? "Y" : "N" })}
                        className="accent-sky-500"
                    />
                    사용
                </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {!isExtra && !isLike ? (
                    <div>
                        <div className="mb-1 text-xs font-medium text-slate-500">보상 포인트</div>
                        <input
                            type="number"
                            min={1}
                            value={row.rewardPoints ?? ""}
                            onChange={(e) =>
                                onChange({
                                    ...row,
                                    rewardPoints: e.target.value === "" ? null : Number(e.target.value),
                                })
                            }
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                        />
                    </div>
                ) : null}

                {isExtra ? (
                    <div>
                        <div className="mb-1 text-xs font-medium text-slate-500">게시글당 추가 적립 상한(합계)</div>
                        <input
                            type="number"
                            min={0}
                            value={row.capInt ?? ""}
                            onChange={(e) =>
                                onChange({
                                    ...row,
                                    capInt: e.target.value === "" ? null : Number(e.target.value),
                                })
                            }
                            className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                        />
                    </div>
                ) : null}

                {isLike ? (
                    <>
                        <div>
                            <div className="mb-1 text-xs font-medium text-slate-500">추천 수 임계값</div>
                            <input
                                type="number"
                                min={1}
                                value={row.thresholdInt ?? ""}
                                onChange={(e) =>
                                    onChange({
                                        ...row,
                                        thresholdInt: e.target.value === "" ? null : Number(e.target.value),
                                    })
                                }
                                className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                            />
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-medium text-slate-500">작성자 보상 포인트</div>
                            <input
                                type="number"
                                min={1}
                                value={row.rewardPoints ?? ""}
                                onChange={(e) =>
                                    onChange({
                                        ...row,
                                        rewardPoints: e.target.value === "" ? null : Number(e.target.value),
                                    })
                                }
                                className="h-10 w-full rounded-lg border border-slate-700 bg-[#081326] px-3 text-slate-100"
                            />
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default function PointPolicyPage() {
    const [rows, setRows] = useState<PointPolicyRow[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void (async () => {
            try {
                setLoading(true);
                const list = await fetchPointPolicies();
                setRows(list);
            } catch (e) {
                setError(e instanceof Error ? e.message : "불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const onSave = async () => {
        if (!rows?.length) return;
        try {
            setSaving(true);
            setError(null);
            await savePointPolicies(rows);
            alert("저장되었습니다.");
        } catch (e) {
            setError(e instanceof Error ? e.message : "저장 실패");
        } finally {
            setSaving(false);
        }
    };

    const updateAt = (idx: number, next: PointPolicyRow) => {
        setRows((prev) => {
            if (!prev) return prev;
            const copy = [...prev];
            copy[idx] = next;
            return copy;
        });
    };

    if (loading || !rows) {
        return (
            <div className="min-h-[50vh] rounded-2xl border border-slate-800 bg-[#0c1017] p-6 text-slate-400">
                {loading ? "불러오는 중…" : "정책을 불러올 수 없습니다."}
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] p-6 text-slate-100 shadow-xl">
            <h1 className="text-2xl font-bold text-white">포인트 정책</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
                활동별 포인트 지급 규칙을 한곳에서 설정합니다. 자유게시판 카테고리는 서버 설정{" "}
                <span className="text-slate-400">app.wallet.free-board-category-codes</span>를 따릅니다.
            </p>

            {error ? (
                <div className="mt-4 rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
                    {error}
                </div>
            ) : null}

            <div className="mt-8 space-y-5">
                {rows.map((row, idx) => (
                    <PolicyCard key={row.policyKey} row={row} onChange={(next) => updateAt(idx, next)} />
                ))}
            </div>

            <div className="mt-8">
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => void onSave()}
                    className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                >
                    {saving ? "저장 중…" : "전체 저장"}
                </button>
            </div>
        </div>
    );
}
