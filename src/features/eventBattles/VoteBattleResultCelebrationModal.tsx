"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import cele from "./EventBattleResultCelebrationModal.module.css";
import local from "./VoteBattleResultCelebrationModal.module.css";

export type VoteShareRow = {
    sortOrder: number;
    label: string;
    votes: number;
    pct: number;
};

type Props = {
    open: boolean;
    onClose: () => void;
    /** 주제 이름만 쉼표로 (예: A, B, C) */
    headlineLabels: string;
    rows: VoteShareRow[];
    isTie: boolean;
    maxVotes: number;
    /** 단독 1위일 때만 */
    winnerLabel: string;
    winnerVotes: number;
    totalVotes: number;
    /** 동점인 주제 라벨들 */
    tieLabels: string[];
};

function runCelebrationConfetti(container: HTMLElement) {
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "2";
    container.appendChild(canvas);

    const fire = confetti.create(canvas, { resize: true, useWorker: true });
    const colors = ["#fbbf24", "#f472b6", "#22d3ee", "#a78bfa", "#facc15", "#fb7185"];

    const burst = () => {
        void fire({
            particleCount: 220,
            spread: 120,
            startVelocity: 56,
            ticks: 320,
            gravity: 0.9,
            scalar: 1.15,
            colors,
            origin: { x: 0.5, y: 0.35 },
        });
    };

    burst();
    const burstTimeout = window.setTimeout(() => {
        void fire({
            particleCount: 280,
            spread: 175,
            startVelocity: 44,
            ticks: 340,
            gravity: 0.85,
            scalar: 1.05,
            colors,
            origin: { x: 0.25, y: 0.2 },
        });
        void fire({
            particleCount: 280,
            spread: 175,
            startVelocity: 44,
            ticks: 340,
            gravity: 0.85,
            scalar: 1.05,
            colors,
            origin: { x: 0.75, y: 0.2 },
        });
    }, 180);

    const timer = window.setInterval(() => {
        void fire({
            particleCount: 44,
            angle: 60 + Math.random() * 60,
            spread: 85,
            startVelocity: 36,
            ticks: 260,
            colors,
            origin: { x: Math.random() * 0.25, y: Math.random() * 0.35 },
        });
        void fire({
            particleCount: 44,
            angle: 60 + Math.random() * 60,
            spread: 85,
            startVelocity: 36,
            ticks: 260,
            colors,
            origin: { x: 0.75 + Math.random() * 0.25, y: Math.random() * 0.35 },
        });
    }, 280);

    return () => {
        window.clearTimeout(burstTimeout);
        window.clearInterval(timer);
        canvas.remove();
    };
}

export default function VoteBattleResultCelebrationModal({
    open,
    onClose,
    headlineLabels,
    rows,
    isTie,
    maxVotes,
    winnerLabel,
    winnerVotes,
    totalVotes,
    tieLabels,
}: Props) {
    const titleId = useId();
    const cleanupRef = useRef<(() => void) | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open || !overlayRef.current) return;
        cleanupRef.current?.();
        cleanupRef.current = null;
        const stop = runCelebrationConfetti(overlayRef.current);
        cleanupRef.current = stop;
        return () => {
            cleanupRef.current?.();
            cleanupRef.current = null;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (typeof document === "undefined") return null;

    const tieNames = tieLabels.join(", ");

    return createPortal(
        <AnimatePresence mode="sync">
            {open ? (
                <motion.div
                    key="vote-battle-celebration"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    ref={overlayRef}
                    className={cele.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    onClick={onClose}
                >
                    <div className={cele.backdropGlow} aria-hidden />
                    <motion.div
                        className={cele.shell}
                        initial={{ scale: 0.2, opacity: 0, rotate: -8 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            rotate: 0,
                            transition: { type: "spring", stiffness: 260, damping: 18, mass: 0.85 },
                        }}
                        exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.2 } }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={cele.inner}>
                            <p id={titleId} className={cele.heroTitle}>
                                투표 결과 발표
                            </p>
                            {headlineLabels ? <p className={local.vsLine}>{headlineLabels}</p> : null}

                            <div className={local.voteRows}>
                                {rows.map((r) => (
                                    <div key={`vote-${r.sortOrder}-${r.label}`} className={local.voteRow}>
                                        <div className={local.voteRowTop}>
                                            <span className={local.voteRowLabel}>{r.label}</span>
                                            <span className={local.voteRowMeta}>
                                                {totalVotes > 0 ? Math.round(r.pct) : 0}% · {r.votes.toLocaleString()}표
                                            </span>
                                        </div>
                                        <div className={local.voteBarTrack}>
                                            <div
                                                className={local.voteBarFill}
                                                style={{ width: `${Math.min(100, r.pct)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {isTie ? (
                                <>
                                    <p className={local.winShout}>동점</p>
                                    <p className={local.winShoutSub}>
                                        {maxVotes === 0
                                            ? `모든 주제 0표 · 총 ${totalVotes.toLocaleString()}표`
                                            : `공동 1위: ${tieNames} · 각 ${maxVotes.toLocaleString()}표 · 총 ${totalVotes.toLocaleString()}표`}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className={local.winShout}>
                                        {winnerLabel} 승리 {winnerVotes.toLocaleString()}/
                                        {totalVotes.toLocaleString()} 투표수
                                    </p>
                                </>
                            )}

                            <button type="button" className={cele.closeBtn} onClick={onClose}>
                                닫기
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>,
        document.body
    );
}
