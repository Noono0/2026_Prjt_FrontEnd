"use client";

import "@/lib/ag-grid";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { AgGridReact } from "ag-grid-react";
import styles from "@/features/members/MembersPage.module.css";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { RoleMenuAssignment } from "./api";
import {
    useActiveRolesForMappingQuery,
    useRoleMenuAssignmentsQuery,
    useSaveRoleMenuMappingsMutation,
} from "./queries";

export type RoleMenuGridRow = {
    menuId: number;
    menuCode: string;
    menuName: string;
    menuPath: string;
    parentMenuId: number | null;
    sortOrder: number;
    roleMenuId: number | null;
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
};

function toGridRow(d: RoleMenuAssignment): RoleMenuGridRow {
    return {
        menuId: Number(d.menuId),
        menuCode: d.menuCode ?? "",
        menuName: d.menuName ?? "",
        menuPath: d.menuPath ?? "",
        parentMenuId: d.parentMenuId ?? null,
        sortOrder: Number(d.sortOrder ?? 0),
        roleMenuId: d.roleMenuId != null ? Number(d.roleMenuId) : null,
        canRead: d.canRead === "Y",
        canCreate: d.canCreate === "Y",
        canUpdate: d.canUpdate === "Y",
        canDelete: d.canDelete === "Y",
    };
}

export default function RoleMenuMappingsPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [roleId, setRoleId] = useState<number | null>(null);
    const [rows, setRows] = useState<RoleMenuGridRow[]>([]);

    const rolesQuery = useActiveRolesForMappingQuery();
    const assignmentsQuery = useRoleMenuAssignmentsQuery(roleId);
    const saveMutation = useSaveRoleMenuMappingsMutation();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const list = rolesQuery.data;
        if (!list?.length) return;
        setRoleId((prev) => {
            if (prev != null) return prev;
            const first = list[0]?.roleId;
            return first != null ? Number(first) : null;
        });
    }, [rolesQuery.data]);

    useEffect(() => {
        const data = assignmentsQuery.data;
        if (!data) return;
        setRows(data.map(toGridRow));
    }, [assignmentsQuery.data]);

    const loadError =
        assignmentsQuery.isError && assignmentsQuery.error
            ? assignmentsQuery.error instanceof Error
                ? assignmentsQuery.error.message
                : "메뉴 목록을 불러오지 못했습니다."
            : null;

    const setPerm = useCallback(
        (menuId: number, field: keyof Pick<RoleMenuGridRow, "canRead" | "canCreate" | "canUpdate" | "canDelete">, value: boolean) => {
            setRows((prev) =>
                prev.map((r) => (r.menuId === menuId ? { ...r, [field]: value } : r))
            );
        },
        []
    );

    /** 조회·등록·수정·삭제 일괄 선택/해제 */
    const setPermAll = useCallback((menuId: number, value: boolean) => {
        setRows((prev) =>
            prev.map((r) =>
                r.menuId === menuId
                    ? {
                          ...r,
                          canRead: value,
                          canCreate: value,
                          canUpdate: value,
                          canDelete: value,
                      }
                    : r
            )
        );
    }, []);

    const isDark = mounted && resolvedTheme === "dark";

    const busy = assignmentsQuery.isFetching || saveMutation.isPending || rolesQuery.isFetching;

    const handleSave = async () => {
        if (roleId == null) {
            alert("역할을 선택하세요.");
            return;
        }
        const items = rows
            .filter((r) => r.canRead || r.canCreate || r.canUpdate || r.canDelete)
            .map((r) => ({
                menuId: r.menuId,
                canRead: r.canRead ? "Y" : "N",
                canCreate: r.canCreate ? "Y" : "N",
                canUpdate: r.canUpdate ? "Y" : "N",
                canDelete: r.canDelete ? "Y" : "N",
            }));
        try {
            await saveMutation.mutateAsync({ roleId, items });
            alert("저장되었습니다.");
        } catch (e) {
            alert(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
        }
    };

    const handleRefetch = async () => {
        await assignmentsQuery.refetch();
    };

    const colDefs = useMemo<ColDef<RoleMenuGridRow>[]>(
        () => [
            { headerName: "메뉴코드", field: "menuCode", width: 140 },
            { headerName: "메뉴명", field: "menuName", flex: 1, minWidth: 160 },
            { headerName: "경로", field: "menuPath", flex: 1, minWidth: 140 },
            { headerName: "순서", field: "sortOrder", width: 80 },
            {
                colId: "permAll",
                headerName: "전체",
                width: 84,
                sortable: false,
                cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
                cellRenderer: (p: ICellRendererParams<RoleMenuGridRow>) => {
                    const r = p.data;
                    if (!r) return null;
                    const allOn =
                        r.canRead && r.canCreate && r.canUpdate && r.canDelete;
                    const someOn =
                        r.canRead || r.canCreate || r.canUpdate || r.canDelete;
                    return (
                        <input
                            type="checkbox"
                            title="이 행의 조회·등록·수정·삭제를 한 번에 선택/해제"
                            ref={(el) => {
                                if (el) {
                                    el.indeterminate = !allOn && someOn;
                                }
                            }}
                            checked={allOn}
                            onChange={(e) => {
                                setPermAll(r.menuId, e.target.checked);
                            }}
                        />
                    );
                },
            },
            {
                headerName: "조회",
                field: "canRead",
                width: 84,
                sortable: false,
                cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
                cellRenderer: (p: ICellRendererParams<RoleMenuGridRow>) => (
                    <input
                        type="checkbox"
                        checked={!!p.data?.canRead}
                        onChange={(e) => {
                            const id = p.data?.menuId;
                            if (id == null) return;
                            setPerm(id, "canRead", e.target.checked);
                        }}
                    />
                ),
            },
            {
                headerName: "등록",
                field: "canCreate",
                width: 84,
                sortable: false,
                cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
                cellRenderer: (p: ICellRendererParams<RoleMenuGridRow>) => (
                    <input
                        type="checkbox"
                        checked={!!p.data?.canCreate}
                        onChange={(e) => {
                            const id = p.data?.menuId;
                            if (id == null) return;
                            setPerm(id, "canCreate", e.target.checked);
                        }}
                    />
                ),
            },
            {
                headerName: "수정",
                field: "canUpdate",
                width: 84,
                sortable: false,
                cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
                cellRenderer: (p: ICellRendererParams<RoleMenuGridRow>) => (
                    <input
                        type="checkbox"
                        checked={!!p.data?.canUpdate}
                        onChange={(e) => {
                            const id = p.data?.menuId;
                            if (id == null) return;
                            setPerm(id, "canUpdate", e.target.checked);
                        }}
                    />
                ),
            },
            {
                headerName: "삭제",
                field: "canDelete",
                width: 84,
                sortable: false,
                cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
                cellRenderer: (p: ICellRendererParams<RoleMenuGridRow>) => (
                    <input
                        type="checkbox"
                        checked={!!p.data?.canDelete}
                        onChange={(e) => {
                            const id = p.data?.menuId;
                            if (id == null) return;
                            setPerm(id, "canDelete", e.target.checked);
                        }}
                    />
                ),
            },
        ],
        [setPerm, setPermAll]
    );

    const defaultColDef = useMemo<ColDef<RoleMenuGridRow>>(
        () => ({
            sortable: true,
            filter: false,
            resizable: true,
        }),
        []
    );

    const roleOptions = rolesQuery.data ?? [];

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>역할–메뉴 매핑</h2>
            <p style={{ margin: "0 0 16px", color: "var(--text-subtle)", fontSize: 14, lineHeight: 1.5 }}>
                아래 목록은 <strong>DB의 MENU 테이블</strong>에 등록된 메뉴 전체입니다. 메뉴가 비어 있으면{" "}
                <strong>메뉴관리</strong> 화면에서 먼저 메뉴를 등록하거나, 백엔드 기동 시{" "}
                <code style={{ fontSize: 13 }}>data.sql</code> 시드가 적용되는지 확인하세요. 역할을 선택한 뒤
                메뉴별 조회·등록·수정·삭제를 설정합니다. 저장 시 해당 역할의 ROLE_MENU 매핑이 모두 교체됩니다.
            </p>

            <div className={styles.sectionTitle}>역할 선택</div>
            <div className={styles.searchGrid} style={{ gridTemplateColumns: "minmax(280px, 1fr)" }}>
                <div>
                    <div className={styles.label}>권한(역할)</div>
                    <select
                        className={styles.fullInput}
                        value={roleId ?? ""}
                        onChange={(e) => {
                            const v = e.target.value;
                            setRoleId(v ? Number(v) : null);
                        }}
                        disabled={busy || !roleOptions.length}
                    >
                        {!roleOptions.length ? (
                            <option value="">권한 목록을 불러오는 중…</option>
                        ) : (
                            roleOptions.map((r) => (
                                <option key={r.roleId} value={r.roleId ?? ""}>
                                    {(r.roleName ?? r.roleCode) + (r.roleCode ? ` (${r.roleCode})` : "")}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            <div className={styles.toolbar}>
                <button type="button" className={styles.primaryButton} onClick={handleSave} disabled={busy || roleId == null}>
                    저장
                </button>
                <button type="button" onClick={handleRefetch} disabled={busy || roleId == null}>
                    새로고침
                </button>
            </div>

            <div className={styles.pageInfo}>
                <span>
                    메뉴 {rows.length}건
                    {assignmentsQuery.isError ? " · 조회 오류" : ""}
                </span>
            </div>

            {loadError && (
                <div
                    style={{
                        marginBottom: 12,
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1px solid var(--danger, #dc2626)",
                        background: "rgba(220, 38, 38, 0.08)",
                        color: "var(--text)",
                        fontSize: 14,
                    }}
                >
                    {loadError}
                </div>
            )}

            {!assignmentsQuery.isFetching &&
                assignmentsQuery.isSuccess &&
                roleId != null &&
                rows.length === 0 && (
                    <div
                        style={{
                            marginBottom: 12,
                            padding: "12px 14px",
                            borderRadius: 12,
                            border: "1px solid var(--border-strong)",
                            background: "var(--panel-2)",
                            color: "var(--text-subtle)",
                            fontSize: 14,
                        }}
                    >
                        표시할 메뉴가 없습니다. <strong>MENU</strong> 테이블에 <code>USE_YN=&apos;Y&apos;</code> 인
                        행이 없습니다. 메뉴관리에서 등록하거나 DB를 확인하세요.
                    </div>
                )}

            <div className={styles.sectionTitle}>메뉴 권한</div>
            <div className={`${isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"} ${styles.gridWrap}`}>
                <AgGridReact<RoleMenuGridRow>
                    theme="legacy"
                    rowData={rows}
                    columnDefs={colDefs}
                    defaultColDef={defaultColDef}
                    animateRows
                    getRowId={(p) => String(p.data.menuId)}
                    suppressPaginationPanel
                />
            </div>
        </div>
    );
}
