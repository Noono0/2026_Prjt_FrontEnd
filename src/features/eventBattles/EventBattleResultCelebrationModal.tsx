"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { EventBattleWinnerPayoutRow } from "./api";
import styles from "./EventBattleResultCelebrationModal.module.css";

type Props = {
    open: boolean;
    onClose: () => void;
    winnerLabel: string;
    /** 이벤트 전체에 모인 베팅 포인트 합 */
    totalPool: number;
    /** 승리 주제 쪽 정산 지급 상위 5 (서버가 settle과 동일 로직으로 계산) */
    winnerPayoutTop5: EventBattleWinnerPayoutRow[];
    /** 상위 5명을 제외한 승리측 인원 수 */
    winnerOtherMemberCount: number;
    /** 상위 5명을 제외한 승리측에게 지급된 포인트 합 */
    winnerOtherPayoutTotal: number;
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

export default function EventBattleResultCelebrationModal({
    open,
    onClose,
    winnerLabel,
    totalPool,
    winnerPayoutTop5,
    winnerOtherMemberCount,
    winnerOtherPayoutTotal,
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

    const list = winnerPayoutTop5 ?? [];

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence mode="sync">
            {open ? (
                <motion.div
                    key="event-battle-celebration"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    ref={overlayRef}
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    onClick={onClose}
                >
                    <div className={styles.backdropGlow} aria-hidden />
                    <motion.div
                        className={styles.shell}
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
                        <div className={styles.inner}>
                            <p id={titleId} className={styles.heroTitle}>
                                포인트 이벤트 결과발표!
                            </p>
                            <p className={styles.heroSub}>
                                선택된 주제는
                                <br />
                                <span className={styles.winnerBadge}>「{winnerLabel}」</span>
                            </p>
                            <p className={styles.heroCheer}>🎉 축하드립니다! 참여해주셔서 감사합니다! 🎉</p>

                            <p className={styles.totalPoolLine}>
                                총 모인 포인트{" "}
                                <span className={styles.totalPoolNum}>{totalPool.toLocaleString("ko-KR")} P</span>
                            </p>

                            {list.length > 0 ? (
                                <div className={styles.rankPanel}>
                                    <p className={styles.rankTitle}>승리 주제 베팅 — 정산 지급 TOP 5</p>
                                    <div className={styles.rankHead}>
                                        <span>순위</span>
                                        <span>닉네임</span>
                                        <span className={styles.colStake}>참여</span>
                                        <span className={styles.colPay}>지급</span>
                                    </div>
                                    <ol className={styles.rankList}>
                                        {list.map((r, i) => {
                                            const rank = r.rank ?? i + 1;
                                            const stake = r.stakePoints ?? 0;
                                            const pay = r.payoutPoints ?? 0;
                                            return (
                                                <li key={`${rank}-${r.memberDisplayName ?? i}`} className={styles.rankRow}>
                                                    <span className={styles.rankNum}>{rank}</span>
                                                    <span className={styles.rankName}>{r.memberDisplayName ?? "—"}</span>
                                                    <span className={styles.rankStake}>{stake.toLocaleString("ko-KR")} P</span>
                                                    <span className={styles.rankPts}>{pay.toLocaleString("ko-KR")} P</span>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>
                            ) : null}

                            {winnerOtherMemberCount > 0 ? (
                                <p className={styles.summaryLine}>
                                    외{" "}
                                    <span className={styles.summaryEm}>{winnerOtherMemberCount.toLocaleString("ko-KR")}명</span>
                                    에게 총{" "}
                                    <span className={styles.summaryEm2}>
                                        {winnerOtherPayoutTotal.toLocaleString("ko-KR")}포인트
                                    </span>
                                    가 지급되었습니다.
                                </p>
                            ) : null}

                            <button type="button" className={styles.closeBtn} onClick={onClose}>
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
