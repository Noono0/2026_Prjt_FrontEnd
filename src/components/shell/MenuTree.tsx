"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import cx from "classnames";
import { MenuNode } from "@/stores/menuStore";
import styles from "./MenuTree.module.css";

/** 쿼리 제거, 끝 슬래시 정리 */
function normalizePath(p: string): string {
    if (!p) return "";
    const base = p.split("?")[0] ?? "";
    if (base === "/") return "/";
    return base.replace(/\/+$/, "") || "/";
}

/**
 * 현재 URL에 대해 하이라이트할 메뉴 id 하나만 선택.
 * - 동일 path 를 쓰는 항목이 여러 개면 → 더 깊은 depth 우선, 그다음 id 로 결정
 * - /members/foo 처럼 하위 경로일 때 → path 길이가 긴(더 구체적인) 메뉴 우선
 */
type ActivePick = { id: string; depth: number; pathLen: number };

function findActiveMenuId(nodes: MenuNode[], pathname: string): string | null {
    const cur = normalizePath(pathname);
    if (!cur) return null;

    const acc: { best: ActivePick | null } = { best: null };

    const consider = (id: string, depth: number, menuPath: string) => {
        const p = normalizePath(menuPath);
        if (!p) return;

        const matches =
            cur === p ||
            (p !== "/" && cur.startsWith(p + "/"));

        if (!matches) return;

        const pathLen = p.length;
        const best = acc.best;
        if (!best) {
            acc.best = { id, depth, pathLen };
            return;
        }
        if (pathLen > best.pathLen) {
            acc.best = { id, depth, pathLen };
            return;
        }
        if (pathLen === best.pathLen) {
            if (depth > best.depth) {
                acc.best = { id, depth, pathLen };
            } else if (depth === best.depth && id < best.id) {
                acc.best = { id, depth, pathLen };
            }
        }
    };

    function walk(ns: MenuNode[], depth: number) {
        for (const n of ns) {
            if (n.path) consider(n.id, depth, n.path);
            if (n.children?.length) walk(n.children, depth + 1);
        }
    }

    walk(nodes, 0);
    return acc.best?.id ?? null;
}

function getLevelClass(level: number) {
    if (level <= 0) return styles.level0;
    if (level === 1) return styles.level1;
    if (level === 2) return styles.level2;
    return styles.level3;
}

function NodeItem({
    node,
    activeId,
    level,
    collapsed,
}: {
    node: MenuNode;
    activeId: string | null;
    level: number;
    collapsed: boolean;
}) {
    const [open, setOpen] = useState(level < 1);
    const hasChildren = (node.children?.length ?? 0) > 0;
    const active = Boolean(node.path) && activeId === node.id;
    const levelClass = getLevelClass(level);

    return (
        <div>
            <div
                className={cx(
                    styles.row,
                    active ? styles.rowActive : styles.rowHover
                )}
            >
                {node.path ? (
                    <Link
                        href={node.path}
                        className={cx(
                            styles.linkButton,
                            collapsed ? styles.collapsedLink : levelClass
                        )}
                        title={node.name}
                    >
                        {collapsed ? node.icon ?? "•" : node.name}
                    </Link>
                ) : (
                    <button
                        className={cx(
                            styles.linkButton,
                            collapsed ? styles.collapsedLink : levelClass
                        )}
                        onClick={() => setOpen((v) => !v)}
                        title={node.name}
                        type="button"
                    >
                        {collapsed ? node.icon ?? "•" : node.name}
                    </button>
                )}

                {hasChildren && !collapsed && (
                    <button
                        className={styles.toggleButton}
                        onClick={() => setOpen((v) => !v)}
                        aria-label="Toggle"
                        type="button"
                    >
                        {open ? "▾" : "▸"}
                    </button>
                )}
            </div>

            {hasChildren && open && (
                <div className={styles.childrenWrap}>
                    {node.children!.map((c) => (
                        <NodeItem
                            key={c.id}
                            node={c}
                            activeId={activeId}
                            level={level + 1}
                            collapsed={collapsed}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function MenuTree({
    nodes,
    pathname,
    collapsed,
}: {
    nodes: MenuNode[];
    pathname: string;
    collapsed: boolean;
}) {
    const activeId = useMemo(
        () => findActiveMenuId(nodes, pathname),
        [nodes, pathname]
    );

    return (
        <div className={styles.tree}>
            {nodes.map((n) => (
                <NodeItem
                    key={n.id}
                    node={n}
                    activeId={activeId}
                    level={0}
                    collapsed={collapsed}
                />
            ))}
        </div>
    );
}
