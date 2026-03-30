"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PointGiftModal } from "./PointGiftModal";
import styles from "./AuthorCellWithMenu.module.css";

export type AuthorMenuContext = {
    memberSeq?: number | null;
    memberId?: string | null;
    /** 화면 표시명(닉네임 우선 API) */
    nickname?: string | null;
    /** 하위 호환: nickname 미전달 시 사용 */
    displayName?: string | null;
    profileImageUrl?: string | null;
};

type Props = {
    memberSeq?: number | null;
    memberId?: string | null;
    nickname?: string | null;
    displayName?: string | null;
    profileImageUrl?: string | null;
    /** 로그인한 회원 seq — 본인 글이면 메뉴 비표시 */
    currentMemberSeq?: number | null;
    variant?: "default" | "compact";
    className?: string;
    onReport?: (ctx: AuthorMenuContext) => void;
    /** 미지정 시 포인트 선물 모달(보유·선물 금액·잔액)을 띄웁니다. */
    onGiftPoints?: (ctx: AuthorMenuContext) => void;
};

function defaultReport(ctx: AuthorMenuContext) {
    window.alert(
        `신고 기능은 준비 중입니다.\n대상: ${ctx.memberId ?? "(아이디 없음)"} (회원번호 ${ctx.memberSeq ?? "-"})`
    );
}

function ChevronDown({ className }: { className?: string }) {
    return (
        <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function AuthorCellWithMenu({
    memberSeq,
    memberId,
    nickname,
    displayName,
    profileImageUrl,
    currentMemberSeq,
    variant = "default",
    className = "",
    onReport = defaultReport,
    onGiftPoints,
}: Props) {
    const [open, setOpen] = useState(false);
    const [giftModalOpen, setGiftModalOpen] = useState(false);
    const [giftCtx, setGiftCtx] = useState<AuthorMenuContext | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const menuId = useId();

    const name = nickname?.trim() || displayName?.trim() || "—";
    const initial = (name === "—" ? "?" : name).slice(0, 1);
    const compact = variant === "compact";

    const hasMember = typeof memberSeq === "number" && memberSeq > 0;
    const isSelf =
        hasMember &&
        typeof currentMemberSeq === "number" &&
        currentMemberSeq > 0 &&
        memberSeq === currentMemberSeq;
    const showMenu = hasMember && !isSelf;

    const ctx: AuthorMenuContext = {
        memberSeq,
        memberId,
        nickname: name !== "—" ? name : null,
        displayName: name !== "—" ? name : null,
        profileImageUrl: profileImageUrl ?? null,
    };

    const close = () => setOpen(false);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const avatarCls = compact ? `${styles.avatar} ${styles.avatarCompact}` : styles.avatar;
    const fbCls = compact ? `${styles.fallback} ${styles.fallbackCompact}` : styles.fallback;
    const nameCls = compact ? `${styles.name} ${styles.nameCompact}` : styles.name;

    const triggerContent = (
        <>
            {profileImageUrl ? (
                <img src={profileImageUrl} alt="" className={avatarCls} />
            ) : (
                <span className={fbCls}>{initial}</span>
            )}
            <span className={nameCls}>{name}</span>
            {showMenu ? <ChevronDown className={styles.chevron} /> : null}
        </>
    );

    return (
        <div className={`${styles.wrap} ${className}`} ref={wrapRef}>
            {showMenu ? (
                <button
                    type="button"
                    className={styles.trigger}
                    aria-expanded={open}
                    aria-haspopup="menu"
                    aria-controls={menuId}
                    onClick={() => setOpen((v) => !v)}
                >
                    {triggerContent}
                </button>
            ) : (
                <div className={`${styles.trigger} ${styles.triggerPlain}`} aria-disabled>
                    {triggerContent}
                </div>
            )}

            {open && showMenu ? (
                <ul id={menuId} className={styles.menu} role="menu">
                    {memberId ? (
                        <li className={styles.menuHint} role="presentation">
                            @{memberId}
                        </li>
                    ) : null}
                    <li role="none">
                        <button
                            type="button"
                            role="menuitem"
                            className={styles.menuItem}
                            onClick={() => {
                                onReport(ctx);
                                close();
                            }}
                        >
                            신고
                        </button>
                    </li>
                    <li role="none">
                        <button
                            type="button"
                            role="menuitem"
                            className={`${styles.menuItem} ${styles.menuItemGift}`}
                            onClick={() => {
                                if (onGiftPoints) {
                                    onGiftPoints(ctx);
                                } else {
                                    setGiftCtx(ctx);
                                    setGiftModalOpen(true);
                                }
                                close();
                            }}
                        >
                            포인트 선물
                        </button>
                    </li>
                </ul>
            ) : null}

            <PointGiftModal
                open={giftModalOpen}
                onClose={() => {
                    setGiftModalOpen(false);
                    setGiftCtx(null);
                }}
                recipient={giftCtx}
            />
        </div>
    );
}
