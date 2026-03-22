"use client";

import "@/lib/ag-grid";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AgGridReact } from "ag-grid-react";
import styles from "@/features/members/MembersPage.module.css";
import type {
    ColDef,
    GridApi,
    GridReadyEvent,
    RowClickedEvent,
    SortChangedEvent,
} from "ag-grid-community";
import type { RoleRow, RoleSearchCondition } from "./api";
import {
    useDeleteRoleMutation,
    useRolesAdminQuery,
    useSaveRoleMutation,
} from "./queries";
import {
    normalizeRoleSearchCondition,
    sameRoleSearchCondition,
} from "@/lib/query/searchConditions";
import RoleModal from "./components/RoleModal";

type RoleFilters = {
    roleCode: string;
    roleName: string;
    useYn: string;
};

type RoleListParams = {
    filters: RoleFilters;
    page: number;
    size: number;
    sortBy: string;
    sortDir: "asc" | "desc";
};

const defaultFilters: RoleFilters = {
    roleCode: "",
    roleName: "",
    useYn: "",
};

const initialListParams: RoleListParams = {
    filters: defaultFilters,
    page: 1,
    size: 20,
    sortBy: "roleId",
    sortDir: "desc",
};

function toListRequest(params: RoleListParams): RoleSearchCondition {
    return normalizeRoleSearchCondition({
        roleCode: params.filters.roleCode,
        roleName: params.filters.roleName,
        useYn: params.filters.useYn,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
    });
}

export default function RolesPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [draftFilters, setDraftFilters] = useState<RoleFilters>(defaultFilters);
    const [listParams, setListParams] = useState<RoleListParams>(initialListParams);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [modalInitial, setModalInitial] = useState<RoleRow | null>(null);

    const gridApiRef = useRef<GridApi<RoleRow> | null>(null);

    const listRequest = useMemo(() => toListRequest(listParams), [listParams]);
    const rolesQuery = useRolesAdminQuery(listRequest);
    const saveMutation = useSaveRoleMutation();
    const deleteMutation = useDeleteRoleMutation();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!rolesQuery.isError || !rolesQuery.error) return;
        const message =
            rolesQuery.error instanceof Error
                ? rolesQuery.error.message
                : "권한 목록 조회 중 오류가 발생했습니다.";
        alert(message);
    }, [rolesQuery.isError, rolesQuery.error]);

    const isDark = mounted && resolvedTheme === "dark";

    const page = listParams.page;
    const pageSize = listParams.size;
    const totalCount = rolesQuery.data?.totalCount ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const items = useMemo(() => rolesQuery.data?.items ?? [], [rolesQuery.data?.items]);

    const busy =
        rolesQuery.isFetching || deleteMutation.isPending || saveMutation.isPending;

    const openEdit = useCallback((row: RoleRow) => {
        setModalMode("edit");
        setModalInitial(row);
        setModalOpen(true);
    }, []);

    const colDefs = useMemo<ColDef<RoleRow>[]>(
        () => [
            { headerName: "ID", field: "roleId", width: 90, sort: "desc" },
            {
                headerName: "권한코드",
                field: "roleCode",
                width: 140,
                cellRenderer: (params: { data?: RoleRow; value?: string }) => (
                    <button
                        type="button"
                        className={styles.linkText}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (params.data) openEdit(params.data);
                        }}
                    >
                        {params.value ?? ""}
                    </button>
                ),
            },
            {
                headerName: "권한명",
                field: "roleName",
                flex: 1,
                minWidth: 160,
                cellRenderer: (params: { data?: RoleRow; value?: string }) => (
                    <button
                        type="button"
                        className={styles.linkText}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (params.data) openEdit(params.data);
                        }}
                    >
                        {params.value ?? ""}
                    </button>
                ),
            },
            { headerName: "사용", field: "useYn", width: 90 },
        ],
        [openEdit, styles.linkText]
    );

    const defaultColDef = useMemo<ColDef<RoleRow>>(
        () => ({
            sortable: true,
            filter: false,
            resizable: true,
        }),
        []
    );

    const handleChangeDraft = (key: keyof RoleFilters, value: string) => {
        setDraftFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleSearch = async () => {
        const nextListParams: RoleListParams = {
            ...listParams,
            filters: { ...draftFilters },
            page: 1,
        };
        const nextReq = toListRequest(nextListParams);
        const curReq = toListRequest(listParams);
        if (sameRoleSearchCondition(nextReq, curReq) && listParams.page === 1) {
            await rolesQuery.refetch();
            return;
        }
        setListParams(nextListParams);
    };

    const handleReset = () => {
        setDraftFilters(defaultFilters);
        setListParams(initialListParams);
    };

    const handleOpenCreate = () => {
        setModalMode("create");
        setModalInitial(null);
        setModalOpen(true);
    };

    const handleOpenEdit = () => {
        const selected = gridApiRef.current?.getSelectedRows()?.[0];
        if (!selected?.roleId) {
            alert("수정할 권한을 선택하세요.");
            return;
        }
        openEdit(selected);
    };

    const handleDelete = async () => {
        const selected = gridApiRef.current?.getSelectedRows()?.[0];
        if (!selected?.roleId) {
            alert("삭제할 권한을 선택하세요.");
            return;
        }
        if (!confirm("선택한 권한을 삭제(미사용 처리)할까요?")) return;
        try {
            await deleteMutation.mutateAsync(selected.roleId);
            if (page > 1 && items.length === 1) {
                setListParams((p) => ({ ...p, page: p.page - 1 }));
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : "삭제 중 오류");
        }
    };

    const handleSave = async (row: RoleRow) => {
        await saveMutation.mutateAsync({ row, mode: modalMode });
    };

    const handleSortChanged = (event: SortChangedEvent<RoleRow>) => {
        const sortModel = event.api.getColumnState().find((col) => col.sort);
        const nextSortBy = sortModel?.colId ?? "roleId";
        const nextSortDir = (sortModel?.sort as "asc" | "desc") ?? "desc";
        setListParams((prev) => ({
            ...prev,
            sortBy: nextSortBy,
            sortDir: nextSortDir,
            page: 1,
        }));
    };

    const handlePageSizeChange = (value: number) => {
        setListParams((prev) => ({ ...prev, size: value, page: 1 }));
    };

    const handleMovePage = (nextPage: number) => {
        if (nextPage < 1 || nextPage > totalPages) return;
        setListParams((prev) => ({ ...prev, page: nextPage }));
    };

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>권한관리</h2>

            <div className={styles.sectionTitle}>검색 조건</div>
            <div className={styles.searchGrid}>
                <div>
                    <div className={styles.label}>권한코드</div>
                    <input
                        className={styles.fullInput}
                        value={draftFilters.roleCode}
                        onChange={(e) => handleChangeDraft("roleCode", e.target.value)}
                        placeholder="권한코드"
                    />
                </div>
                <div>
                    <div className={styles.label}>권한명</div>
                    <input
                        className={styles.fullInput}
                        value={draftFilters.roleName}
                        onChange={(e) => handleChangeDraft("roleName", e.target.value)}
                        placeholder="권한명"
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
                <div />
            </div>

            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleSearch}
                    disabled={busy}
                >
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
                <div className={styles.spacer}>
                    <span>페이지 크기</span>
                    <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        disabled={busy}
                    >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            <div className={styles.pageInfo}>
                <span>
                    전체 {totalCount}건 / {page} / {totalPages} 페이지
                </span>
            </div>

            <div className={styles.sectionTitle}>권한 목록</div>
            <div
                className={`${isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"} ${styles.gridWrap}`}
            >
                <AgGridReact<RoleRow>
                    theme="legacy"
                    rowData={items}
                    columnDefs={colDefs}
                    defaultColDef={defaultColDef}
                    animateRows
                    rowSelection="single"
                    onGridReady={(e: GridReadyEvent<RoleRow>) => {
                        gridApiRef.current = e.api;
                    }}
                    onRowClicked={(e: RowClickedEvent<RoleRow>) => {
                        e.api.deselectAll();
                        if (e.node) e.node.setSelected(true);
                    }}
                    onSortChanged={handleSortChanged}
                    loading={busy}
                />
            </div>

            <div className={styles.paginationBar}>
                <button onClick={() => handleMovePage(1)} disabled={page <= 1 || busy}>
                    처음
                </button>
                <button onClick={() => handleMovePage(page - 1)} disabled={page <= 1 || busy}>
                    이전
                </button>
                <span>
                    {page} / {totalPages}
                </span>
                <button onClick={() => handleMovePage(page + 1)} disabled={page >= totalPages || busy}>
                    다음
                </button>
                <button onClick={() => handleMovePage(totalPages)} disabled={page >= totalPages || busy}>
                    마지막
                </button>
            </div>

            <RoleModal
                open={modalOpen}
                mode={modalMode}
                initial={modalInitial}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
}
