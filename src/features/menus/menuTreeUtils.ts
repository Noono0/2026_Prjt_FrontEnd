import type { MenuRow } from "./api";

/** 0=1레벨 … 3=4레벨 (총 4 depth). 그 아래로는 하위 메뉴 불가 */
export const MAX_MENU_DEPTH_INDEX = 3;

export type MenuTreeRow = MenuRow & {
    depth: number;
    hasChildren: boolean;
    /** 자식이 있을 때만 의미: 펼침 여부 */
    isExpanded: boolean;
};

export function depthIndex(flat: MenuRow[], menuId: number): number {
    const byId = new Map(flat.map((m) => [m.menuId!, m]));
    let d = 0;
    let cur = byId.get(menuId);
    while (cur?.parentMenuId) {
        d++;
        cur = byId.get(cur.parentMenuId);
    }
    return d;
}

/** ancestorId 가 nodeId 의 조상인지 (node 가 ancestor 아래에 있는지) */
export function isDescendantOf(flat: MenuRow[], ancestorId: number, nodeId: number): boolean {
    let cur: MenuRow | undefined = flat.find((m) => m.menuId === nodeId);
    while (cur != null && cur.parentMenuId != null) {
        if (cur.parentMenuId === ancestorId) return true;
        const pid = cur.parentMenuId;
        cur = flat.find((m) => m.menuId === pid);
    }
    return false;
}

/** 자식이 있는 메뉴 ID → 기본은 모두 펼침 */
export function defaultExpandedParentIds(flat: MenuRow[]): Set<number> {
    const s = new Set<number>();
    for (const m of flat) {
        if (m.parentMenuId) s.add(m.parentMenuId);
    }
    return s;
}

export function filterFlatForSearch(
    flat: MenuRow[],
    opts: { menuCode: string; menuName: string; useYn: string; parentMenuId: string }
): MenuRow[] {
    const code = opts.menuCode.trim().toLowerCase();
    const name = opts.menuName.trim().toLowerCase();
    const use = opts.useYn.trim();
    const pid = opts.parentMenuId.trim();

    const rowMatch = (m: MenuRow) => {
        if (code && !(m.menuCode ?? "").toLowerCase().includes(code)) return false;
        if (name && !(m.menuName ?? "").toLowerCase().includes(name)) return false;
        if (use && (m.useYn ?? "") !== use) return false;
        if (pid && String(m.parentMenuId ?? "") !== pid) return false;
        return true;
    };

    const hasFilter = code || name || use || pid;
    if (!hasFilter) return flat;

    const byId = new Map(flat.map((m) => [m.menuId!, m]));
    const keep = new Set<number>();
    for (const m of flat) {
        if (!rowMatch(m)) continue;
        keep.add(m.menuId!);
        let p = m.parentMenuId;
        while (p) {
            keep.add(p);
            p = byId.get(p)?.parentMenuId;
        }
    }
    return flat.filter((m) => keep.has(m.menuId!));
}

function groupByParent(flat: MenuRow[]): Map<number | null, MenuRow[]> {
    const byParent = new Map<number | null, MenuRow[]>();
    for (const m of flat) {
        const p = m.parentMenuId ?? null;
        if (!byParent.has(p)) byParent.set(p, []);
        byParent.get(p)!.push(m);
    }
    for (const arr of byParent.values()) {
        arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return byParent;
}

export function flattenMenuTree(flat: MenuRow[], expanded: Set<number>): MenuTreeRow[] {
    const byParent = groupByParent(flat);
    const out: MenuTreeRow[] = [];

    function walk(parentId: number | null, depth: number) {
        const kids = byParent.get(parentId) ?? [];
        for (const m of kids) {
            const id = m.menuId!;
            const hasChildren = (byParent.get(id)?.length ?? 0) > 0;
            const isExpanded = hasChildren ? expanded.has(id) : false;
            out.push({ ...m, depth, hasChildren, isExpanded });
            if (hasChildren && expanded.has(id)) {
                walk(id, depth + 1);
            }
        }
    }

    walk(null, 0);
    return out;
}

function reindexAll(cloned: MenuRow[]) {
    const byParent = new Map<number | null, MenuRow[]>();
    for (const m of cloned) {
        const p = m.parentMenuId ?? null;
        if (!byParent.has(p)) byParent.set(p, []);
        byParent.get(p)!.push(m);
    }
    for (const kids of byParent.values()) {
        kids.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        kids.forEach((m, i) => {
            m.sortOrder = i;
        });
    }
}

/**
 * 드래그 결과 반영. 실패 시 null.
 * - before/after: over 와 같은 부모 아래에서 순서만 변경
 * - child: Shift+드롭 — over 의 자식으로 이동 (맨 아래)
 */
export function computeDragMove(
    flat: MenuRow[],
    draggedId: number,
    overId: number,
    mode: "before" | "after" | "child"
): MenuRow[] | null {
    if (draggedId === overId) return null;
    const cloned = flat.map((m) => ({ ...m }));
    const byId = new Map(cloned.map((m) => [m.menuId!, m]));
    const dragged = byId.get(draggedId);
    const over = byId.get(overId);
    if (!dragged || !over) return null;

    if (isDescendantOf(cloned, draggedId, overId)) return null;

    if (mode === "child") {
        if (depthIndex(cloned, overId) >= MAX_MENU_DEPTH_INDEX) return null;
        dragged.parentMenuId = overId;
        dragged.sortOrder = 99999;
        reindexAll(cloned);
        return cloned;
    }

    const parentKey = over.parentMenuId ?? null;
    dragged.parentMenuId = parentKey === null ? undefined : parentKey;

    const siblings = cloned
        .filter((m) => (m.parentMenuId ?? null) === (parentKey ?? null) && m.menuId !== draggedId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const idx = siblings.findIndex((m) => m.menuId === overId);
    if (idx < 0) return null;
    const insertAt = mode === "before" ? idx : idx + 1;
    const merged = [...siblings.slice(0, insertAt), dragged, ...siblings.slice(insertAt)];
    merged.forEach((m, i) => {
        m.sortOrder = i;
    });
    reindexAll(cloned);
    return cloned;
}

export function diffMenuRows(before: MenuRow[], after: MenuRow[]): MenuRow[] {
    const beforeMap = new Map(before.map((m) => [m.menuId!, m]));
    const changed: MenuRow[] = [];
    for (const m of after) {
        const id = m.menuId!;
        const o = beforeMap.get(id);
        if (!o) continue;
        const po = o.parentMenuId ?? null;
        const pn = m.parentMenuId ?? null;
        if (po !== pn || (o.sortOrder ?? 0) !== (m.sortOrder ?? 0)) {
            changed.push(m);
        }
    }
    return changed;
}
