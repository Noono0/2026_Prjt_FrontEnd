"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MemberRow } from "./dashboardUtils";
import { ApiError } from "@/features/profile/api";
import {
    fetchSoopLiveStatuses,
    isLiveBadgeEnabled,
    normalizeSoopLink,
    type SoopLiveStatusBatchResponse,
} from "./soopLiveApi";

const POLL_INTERVAL_MS = 35_000;
const MAX_BATCH = 25;
const RATE_LIMIT_PAUSE_MS = 60_000;
const VISIBILITY_ROOT_MARGIN = "80px";

type Options = {
    enabled?: boolean;
    pollIntervalMs?: number;
};

function chunk<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        out.push(items.slice(i, i + size));
    }
    return out;
}

function applyStatuses(members: MemberRow[], batch: SoopLiveStatusBatchResponse): MemberRow[] {
    const statuses = batch.statuses ?? {};
    if (Object.keys(statuses).length === 0) {
        return members;
    }
    let changed = false;
    const next = members.map((member) => {
        const key = normalizeSoopLink(member.soopBroadcastLink);
        if (!key) {
            return member;
        }
        const status = statuses[key];
        if (!status) {
            return member;
        }
        const isLive = Boolean(status.isLive);
        if (member.isLive === isLive) {
            return member;
        }
        changed = true;
        return { ...member, isLive };
    });
    return changed ? next : members;
}

export function useDashboardLiveStatus(
    boardRef: React.RefObject<HTMLElement | null>,
    members: MemberRow[],
    setMembers: React.Dispatch<React.SetStateAction<MemberRow[]>>,
    options?: Options
) {
    const enabled = options?.enabled ?? isLiveBadgeEnabled();
    const pollIntervalMs = options?.pollIntervalMs ?? POLL_INTERVAL_MS;

    const visibleLinksRef = useRef<string[]>([]);
    const visibleSetRef = useRef(new Set<string>());
    const pausedUntilRef = useRef(0);
    const inFlightRef = useRef(false);

    const refreshLive = useCallback(async () => {
        if (!enabled) {
            return;
        }
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
            return;
        }
        if (Date.now() < pausedUntilRef.current) {
            return;
        }
        if (inFlightRef.current) {
            return;
        }

        let links = visibleLinksRef.current;
        if (links.length === 0) {
            links = members
                .map((member) => normalizeSoopLink(member.soopBroadcastLink))
                .filter((link) => link.length > 0)
                .slice(0, MAX_BATCH);
        }
        if (links.length === 0) {
            return;
        }

        inFlightRef.current = true;
        try {
            const batches = chunk(links, MAX_BATCH);
            let merged: SoopLiveStatusBatchResponse = { statuses: {} };
            for (const batchLinks of batches) {
                const part = await fetchSoopLiveStatuses(batchLinks);
                merged = {
                    statuses: { ...merged.statuses, ...(part.statuses ?? {}) },
                };
            }
            setMembers((prev) => applyStatuses(prev, merged));
        } catch (e) {
            if (e instanceof ApiError && (e.status === 429 || e.code === "RATE_LIMITED")) {
                pausedUntilRef.current = Date.now() + RATE_LIMIT_PAUSE_MS;
            }
            console.warn("[Dashboard] LIVE 상태 갱신 실패", e);
        } finally {
            inFlightRef.current = false;
        }
    }, [enabled, members, setMembers]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const root = boardRef.current;
        if (!root) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const link = normalizeSoopLink(entry.target.getAttribute("data-soop-link") ?? "");
                    if (!link) {
                        continue;
                    }
                    if (entry.isIntersecting) {
                        visibleSetRef.current.add(link);
                    } else {
                        visibleSetRef.current.delete(link);
                    }
                }
                visibleLinksRef.current = Array.from(visibleSetRef.current);
            },
            { root: null, rootMargin: VISIBILITY_ROOT_MARGIN, threshold: 0.05 }
        );

        const observeNodes = () => {
            observer.disconnect();
            visibleSetRef.current.clear();
            visibleLinksRef.current = [];
            root.querySelectorAll("[data-soop-link]").forEach((node) => observer.observe(node));
        };

        observeNodes();

        const mutationObserver = new MutationObserver(() => {
            observeNodes();
        });
        mutationObserver.observe(root, { childList: true, subtree: true });

        const initialJitter = Math.floor(Math.random() * 4000);
        const initialTimer = window.setTimeout(() => {
            void refreshLive();
        }, initialJitter);

        const pollTimer = window.setInterval(() => {
            void refreshLive();
        }, pollIntervalMs);

        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                void refreshLive();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
            window.clearTimeout(initialTimer);
            window.clearInterval(pollTimer);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [boardRef, enabled, members.length, pollIntervalMs, refreshLive]);
}
