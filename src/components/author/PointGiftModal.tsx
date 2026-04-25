"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { fetchMyWallet, giftPoints } from "@/features/members/walletApi";
import { bumpWalletRefresh } from "@/stores/walletRefreshStore";

export type PointGiftRecipient = {
    memberSeq?: number | null;
    memberId?: string | null;
    nickname?: string | null;
    displayName?: string | null;
    profileImageUrl?: string | null;
};

type Props = {
    open: boolean;
    onClose: () => void;
    recipient: PointGiftRecipient | null;
};

function fmt(n: number): string {
    return n.toLocaleString("ko-KR");
}

export function PointGiftModal({ open, onClose, recipient }: Props) {
    const titleId = useId();
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [giftDraft, setGiftDraft] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const giftAmount = useMemo(() => {
        const n = Math.floor(Number(String(giftDraft).replace(/,/g, "").trim()));
        if (!Number.isFinite(n) || n < 0) return 0;
        return n;
    }, [giftDraft]);

    const remaining = useMemo(() => {
        if (balance == null) return null;
        if (giftAmount > balance) return null;
        return Math.max(0, balance - giftAmount);
    }, [balance, giftAmount]);

    const overBalance = balance != null && giftAmount > balance;

    const hasRecipientSeq = typeof recipient?.memberSeq === "number" && recipient.memberSeq > 0;

    const canSubmit =
        hasRecipientSeq && balance != null && !loading && !loadError && !submitting && giftAmount > 0 && !overBalance;

    const loadWallet = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const w = await fetchMyWallet();
            setBalance(typeof w.pointBalance === "number" ? w.pointBalance : 0);
        } catch (e) {
            setBalance(null);
            setLoadError(e instanceof Error ? e.message : "포인트를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) {
            setGiftDraft("");
            setBalance(null);
            setLoadError(null);
            setSubmitError(null);
            setSubmitting(false);
            return;
        }
        void loadWallet();
    }, [open, loadWallet]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open || !recipient) return null;

    const nick =
        recipient.nickname?.trim() ||
        recipient.displayName?.trim() ||
        (typeof recipient.memberSeq === "number" ? `회원 #${recipient.memberSeq}` : "대상");
    const loginId = recipient.memberId?.trim() || "";

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0f172a] p-6 text-slate-100 shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <h2 id={titleId} className="text-lg font-bold text-white">
                    포인트 선물
                </h2>
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                    {recipient.profileImageUrl ? (
                        <img
                            src={recipient.profileImageUrl}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-slate-600"
                        />
                    ) : (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold text-slate-200 ring-2 ring-slate-600">
                            {(nick === "—" ? "?" : nick).slice(0, 1)}
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-slate-500">받는 사람</div>
                        <div className="truncate text-lg font-semibold text-white">{nick}</div>
                        {loginId ? (
                            <div className="mt-0.5 truncate text-sm text-slate-400">@{loginId}</div>
                        ) : (
                            <div className="mt-0.5 text-sm text-slate-500">아이디 없음</div>
                        )}
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3">
                        <div className="text-xs font-medium text-slate-500">내 보유 포인트</div>
                        {loading ? (
                            <div className="mt-1 text-sm text-slate-400">불러오는 중…</div>
                        ) : loadError ? (
                            <div className="mt-1 text-sm text-amber-300">{loadError}</div>
                        ) : (
                            <div className="mt-1 text-2xl font-semibold tabular-nums text-sky-400">
                                {balance != null ? `${fmt(balance)} P` : "—"}
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="gift-amount" className="mb-1 block text-xs font-medium text-slate-500">
                            선물할 포인트
                        </label>
                        <input
                            id="gift-amount"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="0"
                            value={giftDraft}
                            onChange={(e) => setGiftDraft(e.target.value.replace(/[^\d]/g, ""))}
                            disabled={loading || balance == null || !!loadError}
                            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none focus:border-sky-500 disabled:opacity-50"
                        />
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3">
                        <div className="text-xs font-medium text-slate-500">차감 후 예상 잔액</div>
                        {balance == null || loading ? (
                            <div className="mt-1 text-sm text-slate-500">—</div>
                        ) : overBalance ? (
                            <div className="mt-1 text-sm text-rose-300">보유 포인트보다 많게 선물할 수 없습니다.</div>
                        ) : (
                            <div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-400">
                                {remaining != null ? `${fmt(remaining)} P` : "—"}
                            </div>
                        )}
                    </div>

                    {submitError ? (
                        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                            {submitError}
                        </div>
                    ) : null}
                </div>

                <div className="mt-8 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                    >
                        닫기
                    </button>
                    <button
                        type="button"
                        disabled={!canSubmit}
                        title={
                            canSubmit
                                ? undefined
                                : !hasRecipientSeq
                                  ? "받는 회원 정보가 없습니다."
                                  : "선물할 포인트를 입력해 주세요."
                        }
                        onClick={async () => {
                            if (!canSubmit || !recipient || typeof recipient.memberSeq !== "number") return;
                            setSubmitError(null);
                            setSubmitting(true);
                            try {
                                await giftPoints(recipient.memberSeq, giftAmount);
                                bumpWalletRefresh();
                                onClose();
                            } catch (e) {
                                setSubmitError(e instanceof Error ? e.message : "선물 처리에 실패했습니다.");
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                            canSubmit
                                ? "bg-sky-600 text-white hover:bg-sky-500"
                                : "cursor-not-allowed bg-sky-900/40 text-slate-500"
                        }`}
                    >
                        {submitting ? "처리 중…" : "선물하기"}
                    </button>
                </div>
            </div>
        </div>
    );
}
