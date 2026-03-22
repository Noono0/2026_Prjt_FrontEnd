import type { MenuRow } from "./api";

export type MenuNode = {
    id: string;
    name: string;
    data: MenuRow;
    children?: MenuNode[];
};

/** JSON.stringify/parse 금지 — undefined 제거로 menuCode 누락 방지 */
export function cloneMenuTree(nodes: MenuNode[]): MenuNode[] {
    return nodes.map((n) => ({
        id: n.id,
        name: n.name,
        data: { ...n.data },
        children: n.children?.length ? cloneMenuTree(n.children) : [],
    }));
}

export function buildMenuTree(rows: MenuRow[]): MenuNode[] {
    const map = new Map<number, MenuNode>();
    const roots: MenuNode[] = [];

    const sorted = [...rows].sort((a, b) => {
        const pa = a.parentMenuId ?? 0;
        const pb = b.parentMenuId ?? 0;
        if (pa !== pb) return pa - pb;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

    for (const row of sorted) {
        if (!row.menuId) continue;
        map.set(row.menuId, {
            id: String(row.menuId),
            name: row.menuName ?? "",
            data: { ...row },
            children: [],
        });
    }

    for (const row of sorted) {
        if (!row.menuId) continue;
        const node = map.get(row.menuId);
        if (!node) continue;

        if (!row.parentMenuId) {
            roots.push(node);
            continue;
        }

        const parent = map.get(row.parentMenuId);
        if (!parent) {
            roots.push(node);
            continue;
        }

        parent.children ??= [];
        parent.children.push(node);
    }

    return roots;
}

export function flattenTree(nodes: MenuNode[]): MenuRow[] {
    const result: MenuRow[] = [];

    function walk(items: MenuNode[], parentMenuId?: number) {
        items.forEach((node, index) => {
            const menuId = Number(node.id);
            const row: MenuRow = {
                ...node.data,
                menuId,
                parentMenuId,
                sortOrder: index + 1,
            };
            result.push(row);

            if (node.children?.length) {
                walk(node.children, menuId);
            }
        });
    }

    walk(nodes, undefined);
    return result;
}

/** 편집 중인 메뉴를 상위로 선택할 수 없음: 자기 자신 + 모든 하위 메뉴 id */
export function collectDescendantMenuIds(flat: MenuRow[], rootId: number): Set<number> {
    const byParent = new Map<number | null, number[]>();
    for (const m of flat) {
        if (m.menuId == null) continue;
        const p = m.parentMenuId ?? null;
        if (!byParent.has(p)) byParent.set(p, []);
        byParent.get(p)!.push(m.menuId);
    }
    const out = new Set<number>();
    const stack = [...(byParent.get(rootId) ?? [])];
    while (stack.length) {
        const id = stack.pop()!;
        out.add(id);
        const kids = byParent.get(id) ?? [];
        stack.push(...kids);
    }
    return out;
}

/** 상위 메뉴 콤보: 순환 방지를 위해 편집 대상·하위는 제외 */
export function nextSortOrderForParent(flat: MenuRow[], parentId: number | undefined): number {
    const siblings = flat.filter((m) => (m.parentMenuId ?? null) === (parentId ?? null));
    const max = siblings.reduce((acc, m) => Math.max(acc, m.sortOrder ?? 0), 0);
    return max + 1;
}

export function filterSelectableParents(flat: MenuRow[], editingMenuId?: number): MenuRow[] {
    if (!editingMenuId) return flat;
    const bad = collectDescendantMenuIds(flat, editingMenuId);
    bad.add(editingMenuId);
    return flat.filter((m) => m.menuId != null && !bad.has(m.menuId));
}

export function diffMenus(before: MenuRow[], after: MenuRow[]): MenuRow[] {
    const beforeMap = new Map<number, MenuRow>();
    before.forEach((row) => {
        if (row.menuId) beforeMap.set(row.menuId, row);
    });

    return after.filter((row) => {
        if (!row.menuId) return false;
        const old = beforeMap.get(row.menuId);
        if (!old) return false;

        return (
            (old.parentMenuId ?? null) !== (row.parentMenuId ?? null) ||
            (old.sortOrder ?? 0) !== (row.sortOrder ?? 0)
        );
    });
}

/**
 * 드래그 등으로 구조만 바뀐 행을 저장할 때 사용.
 * JSON 복제·flatten 과정에서 menuCode 등이 빠질 수 있으므로, 서버로 보내기 전에
 * 원본 목록의 필드를 유지하고 parentMenuId·sortOrder 만 덮어씀.
 */
export function mergeStructureIntoOriginal(
    originalFlat: MenuRow[],
    structural: MenuRow[]
): MenuRow[] {
    const byId = new Map<number, MenuRow>();
    for (const r of originalFlat) {
        if (r.menuId != null) byId.set(r.menuId, r);
    }
    const out: MenuRow[] = [];
    for (const row of structural) {
        if (row.menuId == null) continue;
        const orig = byId.get(row.menuId);
        if (!orig) continue;
        const code = String(orig.menuCode ?? "").trim();
        if (!code) continue;
        out.push({
            ...orig,
            menuId: orig.menuId,
            menuCode: code,
            parentMenuId: row.parentMenuId,
            sortOrder: row.sortOrder,
        });
    }
    return out;
}