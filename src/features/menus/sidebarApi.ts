import { defaultApiRequestInit } from "@/lib/http/requestInit";
import type { MenuNode } from "@/stores/menuStore";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type ApiResponse<T> = {
    success: boolean;
    code?: string;
    message?: string;
    data: T;
};

export type BackendMenuRow = {
    menuId?: number;
    menuCode?: string;
    menuName?: string;
    menuPath?: string;
    parentMenuId?: number | null;
    sortOrder?: number;
    useYn?: string;
};

/** 기본 사이드바(defaultMenu)와 겹치는 시드 메뉴는 "추가 메뉴"에서 제외 */
const RESERVED_MENU_CODES = new Set([
    "MEMBER",
    "ROLE",
    "MENU",
    "CODE_GROUP",
    "CODE_DETAIL",
    "PRODUCT",
    "ORDER",
]);

function buildApiUrl(path: string) {
    return `${API_BASE_URL}${path}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(buildApiUrl(path), {
        ...defaultApiRequestInit,
        ...init,
    });

    let json: ApiResponse<T> | null = null;

    try {
        json = (await res.json()) as ApiResponse<T>;
    } catch {
        throw new Error("응답 형식이 올바르지 않습니다.");
    }

    if (!res.ok || !json?.success) {
        throw new Error(json?.message ?? "메뉴 조회에 실패했습니다.");
    }

    return json.data;
}

/**
 * 사이드바 추가 메뉴는 권한 매핑 기준이 아니라
 * 메뉴관리에서 만든 전체 메뉴(tree) 기준으로 읽는다.
 */
function normalizePath(p: string | undefined | null): string | undefined {
    const s = (p ?? "").trim();
    if (!s) return undefined;
    if (s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://")) return s;
    return `/${s}`;
}

export async function fetchAllMenusForSidebar(): Promise<BackendMenuRow[]> {
    const data = await apiFetch<BackendMenuRow[]>("/api/menus/sidebar", {
        method: "GET",
    });
    return Array.isArray(data) ? data : [];
}

export function toExtraMenuTree(rows: BackendMenuRow[]): MenuNode[] {
    const filtered = (rows ?? [])
        .filter((row) => row.useYn !== "N")
        .filter(
            (row) =>
                !RESERVED_MENU_CODES.has(String(row.menuCode ?? "").toUpperCase())
        );

    type InternalNode = MenuNode & {
        _menuId: number;
        _parentMenuId: number | null;
        _sortOrder: number;
    };

    const map = new Map<number, InternalNode>();
    const roots: InternalNode[] = [];

    for (const row of filtered) {
        if (row.menuId == null) continue;

        map.set(row.menuId, {
            id: String(row.menuId),
            name: row.menuName ?? row.menuCode ?? `MENU_${row.menuId}`,
            path: normalizePath(row.menuPath),
            children: [],
            _menuId: row.menuId,
            _parentMenuId: row.parentMenuId ?? null,
            _sortOrder: row.sortOrder ?? 0,
        });
    }

    for (const node of map.values()) {
        if (node._parentMenuId == null) {
            roots.push(node);
            continue;
        }

        const parent = map.get(node._parentMenuId);
        if (!parent) {
            roots.push(node);
            continue;
        }

        parent.children = parent.children ?? [];
        parent.children.push(node);
    }

    const sortNodes = (nodes: InternalNode[]) => {
        nodes.sort((a, b) => a._sortOrder - b._sortOrder);

        nodes.forEach((node) => {
            if (node.children?.length) {
                sortNodes(node.children as InternalNode[]);
            }
        });
    };

    sortNodes(roots);

    const stripMeta = (nodes: InternalNode[]): MenuNode[] =>
        nodes.map((node) => ({
            id: node.id,
            name: node.name,
            path: node.path,
            children: node.children?.length
                ? stripMeta(node.children as InternalNode[])
                : undefined,
        }));

    return stripMeta(roots);
}