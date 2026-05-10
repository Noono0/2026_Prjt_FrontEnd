"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Flame, LayoutList, Sparkles } from "lucide-react";
import { fetchBoardPopularConfig, searchBoards } from "@/features/boards/api";
import type { BoardListItem } from "@/features/boards/types";
import styles from "./Dashboard.module.css";

const LIST_SIZE = 8;

function formatFeedTime(createDt?: string): string {
    if (!createDt) return "-";
    const d = new Date(createDt.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return createDt.slice(0, 16);

    const now = new Date();
    const sameDay =
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();

    if (sameDay) {
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function firstImageSrcFromHtml(html?: string | null): string | null {
    if (!html) return null;
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const src = m?.[1]?.trim();
    return src || null;
}

function BoardFeedColumn({
    title,
    badge,
    icon,
    items,
    loading,
    error,
    emptyHint,
}: {
    title: string;
    badge: string;
    icon: ReactNode;
    items: BoardListItem[];
    loading: boolean;
    error: string | null;
    emptyHint: string;
}) {
    return (
        <section className={styles.feedColumn} aria-label={title}>
            <header className={styles.feedColumnHeader}>
                <span className={styles.feedColumnIconWrap} aria-hidden>
                    {icon}
                </span>
                <div className={styles.feedColumnTitles}>
                    <h2 className={styles.feedColumnHeading}>{title}</h2>
                    <span className={styles.feedColumnBadge}>{badge}</span>
                </div>
            </header>
            {loading ? (
                <div className={styles.feedMuted}>불러오는 중…</div>
            ) : error ? (
                <div className={styles.feedError}>{error}</div>
            ) : items.length === 0 ? (
                <div className={styles.feedMuted}>{emptyHint}</div>
            ) : (
                <ul className={styles.feedList}>
                    {items.map((row) => {
                        const seq = row.boardSeq;
                        if (seq == null) return null;
                        const cc = row.commentCount ?? 0;
                        const href = `/boards/${seq}`;
                        const thumb = firstImageSrcFromHtml(row.content);
                        return (
                            <li key={seq} className={styles.feedRow}>
                                <Link href={href} className={styles.feedMain}>
                                    <p className={styles.feedTitleLine}>
                                        <span className={styles.feedTitleText}>{row.title ?? "(제목 없음)"}</span>
                                        {cc > 0 ? <span className={styles.feedCommentCount}>[{cc}]</span> : null}
                                    </p>
                                    <div className={styles.feedMeta}>
                                        <span>{formatFeedTime(row.createDt)}</span>
                                        <span className={styles.feedMetaSep}>·</span>
                                        <span className={styles.feedAuthor}>{row.writerName ?? "-"}</span>
                                        <span className={styles.feedMetaSep}>·</span>
                                        <span>조회 {row.viewCount ?? 0}</span>
                                        <span className={styles.feedMetaSep}>·</span>
                                        <span className={styles.feedLikes}>추천 {row.likeCount ?? 0}</span>
                                    </div>
                                </Link>
                                {thumb ? (
                                    <div className={styles.feedThumbWrap}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={thumb} alt="" className={styles.feedThumb} />
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            )}
            <div className={styles.feedMore}>
                <Link href="/boards" className={styles.feedMoreLink}>
                    자유게시판 더보기 →
                </Link>
            </div>
        </section>
    );
}

export default function DashboardBoardFeeds() {
    const [popular, setPopular] = useState<BoardListItem[]>([]);
    const [latest, setLatest] = useState<BoardListItem[]>([]);
    const [restPage, setRestPage] = useState<BoardListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hotLabel, setHotLabel] = useState("HOT");

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const cfg = await fetchBoardPopularConfig();
                if (!mounted) return;
                setHotLabel(cfg.badgeLabel?.trim() || "HOT");
                const threshold = typeof cfg.threshold === "number" && cfg.threshold >= 0 ? cfg.threshold : 50;

                const [popRes, latRes, restRes] = await Promise.all([
                    searchBoards({
                        page: 1,
                        size: LIST_SIZE,
                        sortBy: "boardSeq",
                        sortDir: "desc",
                        showYn: "Y",
                        minLikeCount: threshold,
                    }),
                    searchBoards({
                        page: 1,
                        size: LIST_SIZE,
                        sortBy: "boardSeq",
                        sortDir: "desc",
                        showYn: "Y",
                    }),
                    searchBoards({
                        page: 2,
                        size: LIST_SIZE,
                        sortBy: "boardSeq",
                        sortDir: "desc",
                        showYn: "Y",
                    }),
                ]);

                if (!mounted) return;
                setPopular(popRes.items ?? []);
                setLatest(latRes.items ?? []);
                setRestPage(restRes.items ?? []);
            } catch (e) {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : "게시글 목록을 불러오지 못했습니다.");
                setPopular([]);
                setLatest([]);
                setRestPage([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className={styles.feedGrid}>
            <BoardFeedColumn
                title="인기글"
                badge={hotLabel}
                icon={<Flame size={18} className="text-amber-400" />}
                items={popular}
                loading={loading}
                error={error}
                emptyHint="표시할 인기글이 없습니다."
            />
            <BoardFeedColumn
                title="최신글"
                badge="NEW"
                icon={<Sparkles size={18} className="text-sky-400" />}
                items={latest}
                loading={loading}
                error={error}
                emptyHint="등록된 글이 없습니다."
            />
            <BoardFeedColumn
                title="전체글"
                badge="ALL"
                icon={<LayoutList size={18} className="text-slate-400" />}
                items={restPage}
                loading={loading}
                error={error}
                emptyHint="더 불러올 글이 없습니다."
            />
        </div>
    );
}
