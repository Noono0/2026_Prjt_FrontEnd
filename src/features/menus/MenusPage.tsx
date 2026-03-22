"use client";

import "@/lib/ag-grid";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AgGridReact } from "ag-grid-react";
import { useQueryClient } from "@tanstack/react-query";
import styles from "@/features/members/MembersPage.module.css";
import treeStyles from "./menusTree.module.css";
import type {
    ColDef,
    GridApi,
    GridReadyEvent,
    ICellRendererParams,
    RowClickedEvent,
    RowDragEndEvent,
} from "ag-grid-community";
import type { MenuRow } from "./api";
import { saveMenu } from "./api";
import {
    computeDragMove,
    defaultExpandedParentIds,
    diffMenuRows,
    filterFlatForSearch,
    flattenMenuTree,
    type MenuTreeRow,
} from "./menuTreeUtils";
import {
    menuAdminKeys,
    useDeleteMenuMutation,
    useMenuTreeQuery,
    useSaveMenuMutation,
} from "./queries";
import MenuModal from "./components/MenuModal";

type MenuFilters = {
    menuCode: string;
    menuName: string;
    useYn: string;
    parentMenuId: string;
};

const defaultFilters: MenuFilters = {
    menuCode: "",
    menuName: "",
    useYn: "",
    parentMenuId: "",
};

export default function MenusPage() {
    const { resolvedTheme } = useTheme();
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);

    const [draftFilters, setDraftFilters] = useState<MenuFilters>(defaultFilters);
    const [appliedFilters, setAppliedFilters] = useState<MenuFilters>(defaultFilters);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [modalInitial, setModalInitial] = useState<MenuRow | null>(null);

    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const flatSignatureRef = useRef<string>("");

    const gridApiRef = useRef<GridApi<MenuTreeRow> | null>(null);

    const menusQuery = useMenuTreeQuery();
    const saveMutation = useSaveMenuMutation();
    const deleteMutation = useDeleteMenuMutation();

    const flatMenus = menusQuery.data ?? [];

    const menuNameById = useMemo(() => {
        const m = new Map<number, string>();
        for (const row of flatMenus) {
            if (row.menuId != null) m.set(row.menuId, row.menuName ?? "");
        }
        return m;
    }, [flatMenus]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!menusQuery.isError || !menusQuery.error) return;
        const message =
            menusQuery.error instanceof Error
                ? menusQuery.error.message
                : "메뉴 목록 조회 중 오류가 발생했습니다.";
        alert(message);
    }, [menusQuery.isError, menusQuery.error]);

    const filteredFlat = useMemo(
        () => filterFlatForSearch(flatMenus, appliedFilters),
        [flatMenus, appliedFilters]
    );

    useEffect(() => {
        const sig = filteredFlat.map((m) => m.menuId).join(",");
        if (sig === flatSignatureRef.current) return;
        flatSignatureRef.current = sig;
        setExpanded(defaultExpandedParentIds(filteredFlat));
    }, [filteredFlat]);

    const treeRows = useMemo(
        () => flattenMenuTree(filteredFlat, expanded),
        [filteredFlat, expanded]
    );

    const isDark = mounted && resolvedTheme === "dark";

    const busy =
        menusQuery.isFetching || deleteMutation.isPending || saveMutation.isPending;

    const toggleExpand = useCallback((menuId: number) => {
        setExpanded((prev) => {
            const n = new Set(prev);
            if (n.has(menuId)) n.delete(menuId);
            else n.add(menuId);
            return n;
        });
    }, []);

    const openEdit = useCallback((row: MenuRow) => {
        setModalMode("edit");
        setModalInitial(row);
        setModalOpen(true);
    }, []);

    const handleRowDragEnd = useCallback(
        async (e: RowDragEndEvent<MenuTreeRow>) => {
            if (busy) return;
            const dragged = e.node.data;
            const over = e.overNode?.data;
            if (!dragged?.menuId || !over?.menuId) return;
            if (dragged.menuId === over.menuId) return;

            const overNode = e.overNode;
            if (!overNode) return;
            const h = overNode.rowHeight ?? 40;
            const top = overNode.rowTop ?? 0;
            const mid = top + h / 2;
            const place = e.y < mid ? "before" : "after";
            const mode = e.event.shiftKey ? "child" : place;

            const next = computeDragMove(flatMenus, dragged.menuId, over.menuId, mode);
            if (!next) {
                alert(
                    "이동할 수 없습니다. (최대 4 depth, 자신의 하위 메뉴 안으로는 이동할 수 없습니다.)"
                );
                return;
            }
            const changed = diffMenuRows(flatMenus, next);
            if (changed.length === 0) return;
            try {
                await Promise.all(changed.map((row) => saveMenu(row, "edit")));
                await queryClient.invalidateQueries({ queryKey: menuAdminKeys.all });
            } catch (err) {
                alert(err instanceof Error ? err.message : "저장 중 오류");
            }
        },
        [busy, flatMenus, queryClient]
    );

    const colDefs = useMemo<ColDef<MenuTreeRow>[]>(
        () => [
            {
                colId: "drag",
                rowDrag: true,
                width: 44,
                sortable: false,
                suppressHeaderMenuButton: true,
                headerName: "",
                cellStyle: { cursor: "grab" },
            },
            {
                headerName: "메뉴명",
                field: "menuName",
                flex: 1,
                minWidth: 200,
                sortable: false,
                cellRenderer: (p: ICellRendererParams<MenuTreeRow>) => {
                    const row = p.data;
                    if (!row) return null;
                    const depth = row.depth ?? 0;
                    return (
                        <div className={treeStyles.treeRow}>
                            {Array.from({ length: depth }).map((_, i) => (
                                <span key={i} className={treeStyles.treeGuide} aria-hidden />
                            ))}
                            {row.hasChildren ? (
                                <button
                                    type="button"
                                    className={treeStyles.treeToggle}
                                    aria-label={row.isExpanded ? "접기" : "펼치기"}
                                    onClick={(ev) => {
                                        ev.stopPropagation();
                                        if (row.menuId) toggleExpand(row.menuId);
                                    }}
                                >
                                    {row.isExpanded ? "▼" : "▶"}
                                </button>
                            ) : (
                                <span className={treeStyles.treeTogglePlaceholder} />
                            )}
                            <button
                                type="button"
                                className={styles.linkText}
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    openEdit(row);
                                }}
                                style={{ alignSelf: "center" }}
                            >
                                {row.menuName ?? ""}
                            </button>
                        </div>
                    );
                },
            },
            {
                headerName: "상위메뉴",
                width: 140,
                sortable: false,
                valueGetter: (p) => {
                    const pid = p.data?.parentMenuId;
                    if (pid == null) return "— (루트)";
                    return menuNameById.get(pid) ?? `#${pid}`;
                },
            },
            { headerName: "메뉴코드", field: "menuCode", width: 130 },
            { headerName: "경로", field: "menuPath", flex: 1, minWidth: 120 },
            { headerName: "정렬", field: "sortOrder", width: 72 },
            { headerName: "사용", field: "useYn", width: 72 },
        ],
        [menuNameById, openEdit, styles.linkText, toggleExpand]
    );

    const defaultColDef = useMemo<ColDef<MenuTreeRow>>(
        () => ({
            sortable: false,
            filter: false,
            resizable: true,
        }),
        []
    );

    const handleChangeDraft = (key: keyof MenuFilters, value: string) => {
        setDraftFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleSearch = async () => {
        setAppliedFilters({ ...draftFilters });
        await menusQuery.refetch();
    };

    const handleReset = () => {
        setDraftFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
    };

    const handleOpenCreate = () => {
        setModalMode("create");
        setModalInitial(null);
        setModalOpen(true);
    };

    const handleOpenEdit = () => {
        const selected = gridApiRef.current?.getSelectedRows()?.[0];
        if (!selected?.menuId) {
            alert("수정할 메뉴를 선택하세요.");
            return;
        }
        openEdit(selected);
    };

    const handleDelete = async () => {
        const selected = gridApiRef.current?.getSelectedRows()?.[0];
        if (!selected?.menuId) {
            alert("삭제할 메뉴를 선택하세요.");
            return;
        }
        if (!confirm("선택한 메뉴를 삭제(미사용 처리)할까요?")) return;
        try {
            await deleteMutation.mutateAsync(selected.menuId);
        } catch (err) {
            alert(err instanceof Error ? err.message : "삭제 중 오류");
        }
    };

    const handleSave = async (row: MenuRow) => {
        await saveMutation.mutateAsync({ row, mode: modalMode });
    };

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>메뉴관리 (트리)</h2>
            <p
                style={{
                    margin: "0 0 16px",
                    color: "var(--text-subtle)",
                    fontSize: 14,
                    lineHeight: 1.55,
                }}
            >
                왼쪽 세로선은 <strong>depth(단계)</strong>, <strong>▶/▼</strong>로 하위를 접고 펼칩니다. DB에
                하위 메뉴(<code>PARENT_MENU_ID</code>)가 없으면 모두 루트로만 보여 <strong>평면 목록</strong>처럼
                보일 수 있습니다. <strong>드래그</strong>로 순서·위치 변경, <strong>Shift + 드롭</strong>은 자식으로
                붙이기(최대 <strong>4 depth</strong>).
            </p>

            <div className={styles.sectionTitle}>검색 조건</div>
            <div className={styles.searchGrid}>
                <div>
                    <div className={styles.label}>메뉴코드</div>
                    <input
                        className={styles.fullInput}
                        value={draftFilters.menuCode}
                        onChange={(e) => handleChangeDraft("menuCode", e.target.value)}
                        placeholder="메뉴코드"
                    />
                </div>
                <div>
                    <div className={styles.label}>메뉴명</div>
                    <input
                        className={styles.fullInput}
                        value={draftFilters.menuName}
                        onChange={(e) => handleChangeDraft("menuName", e.target.value)}
                        placeholder="메뉴명"
                    />
                </div>
                <div>
                    <div className={styles.label}>상위 메뉴 ID</div>
                    <input
                        className={styles.fullInput}
                        value={draftFilters.parentMenuId}
                        onChange={(e) => handleChangeDraft("parentMenuId", e.target.value)}
                        placeholder="숫자"
                    />
                </div>
                <div>
                    <div className={styles.label}>사용여부</div>
                    <select
                        className={styles.fullInput}
                        value={draftFilters.useYn}
                        onChange={(e) => handleChangeDraft("useYn", e.target.value)}
                    >
                        <option value="">전체</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                    </select>
                </div>
            </div>

            <div className={styles.toolbar}>
                <button type="button" className={styles.primaryButton} onClick={handleSearch} disabled={busy}>
                    조회
                </button>
                <button type="button" onClick={handleReset} disabled={busy}>
                    초기화
                </button>
                <button type="button" onClick={handleOpenCreate} disabled={busy}>
                    등록
                </button>
                <button type="button" onClick={handleOpenEdit} disabled={busy}>
                    수정
                </button>
                <button type="button" className={styles.dangerButton} onClick={handleDelete} disabled={busy}>
                    삭제
                </button>
            </div>

            <div className={styles.pageInfo}>
                <span>표시 {treeRows.length}건 (전체 {flatMenus.length}건)</span>
            </div>

            <div className={styles.sectionTitle}>메뉴 트리</div>
            <div
                className={`${isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"} ${styles.gridWrap}`}
            >
                <AgGridReact<MenuTreeRow>
                    theme="legacy"
                    rowData={treeRows}
                    columnDefs={colDefs}
                    defaultColDef={defaultColDef}
                    animateRows
                    rowSelection="single"
                    getRowId={(p) => String(p.data.menuId)}
                    rowDragManaged={false}
                    suppressMoveWhenRowDragging={true}
                    onRowDragEnd={handleRowDragEnd}
                    onGridReady={(e: GridReadyEvent<MenuTreeRow>) => {
                        gridApiRef.current = e.api;
                    }}
                    onRowClicked={(e: RowClickedEvent<MenuTreeRow>) => {
                        e.api.deselectAll();
                        if (e.node) e.node.setSelected(true);
                    }}
                    loading={busy}
                />
            </div>

            <MenuModal
                open={modalOpen}
                mode={modalMode}
                initial={modalInitial}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
}
