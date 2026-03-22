"use client";

import "@/lib/ag-grid";
import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "next-themes";
import type {
    ColDef,
    RowClickedEvent,
    SortChangedEvent,
} from "ag-grid-community";
import styles from "./CodeGrid.module.css";
import type { CodeGroupRow } from "../api";

type Props = {
    rows: CodeGroupRow[];
    loading: boolean;
    totalCount: number;
    page: number;
    size: number;
    selectedRow: CodeGroupRow | null;
    onSelectRow: (row: CodeGroupRow) => void;
    onCreate: () => void;
    onEdit: () => void;
    onChangePage: (page: number) => void;
    onChangePageSize: (size: number) => void;
    onChangeSort: (sortBy: string, sortDir: "asc" | "desc") => void;
    onOpenRowEdit: (row: CodeGroupRow) => void;
    gridHeight?: number;
};

export default function CodeGroupGrid({
                                          rows,
                                          loading,
                                          totalCount,
                                          page,
                                          size,
                                          onSelectRow,
                                          onCreate,
                                          onEdit,
                                          onChangePage,
                                          onChangePageSize,
                                          onChangeSort,
                                          onOpenRowEdit,
                                          gridHeight = 230,
                                      }: Props) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const totalPages = Math.max(1, Math.ceil(totalCount / size));

    const gridThemeClass = useMemo(() => {
        if (!mounted) return "ag-theme-quartz";
        return resolvedTheme === "dark"
            ? "ag-theme-quartz-dark"
            : "ag-theme-quartz";
    }, [mounted, resolvedTheme]);

    const columnDefs = useMemo<ColDef[]>(
        () => [
            { headerName: "SEQ", field: "codeGroupSeq", width: 100, sortable: true },
            {
                headerName: "그룹ID",
                field: "codeGroupId",
                width: 160,
                sortable: true,
                cellRenderer: (params: { data?: CodeGroupRow; value?: string }) => (
                    <button
                        type="button"
                        className={styles.linkButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!params.data) return;
                            onOpenRowEdit(params.data);
                        }}
                    >
                        {params.value ?? ""}
                    </button>
                ),
            },
            {
                headerName: "그룹명",
                field: "codeGroupName",
                flex: 1,
                minWidth: 180,
                sortable: true,
                cellRenderer: (params: { data?: CodeGroupRow; value?: string }) => (
                    <button
                        type="button"
                        className={styles.linkButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!params.data) return;
                            onOpenRowEdit(params.data);
                        }}
                    >
                        {params.value ?? ""}
                    </button>
                ),
            },
            { headerName: "설명", field: "description", flex: 1, minWidth: 200 },
            { headerName: "정렬", field: "sortOrder", width: 100, sortable: true },
            { headerName: "사용", field: "useYn", width: 90 },
        ],
        [onOpenRowEdit]
    );

    const defaultColDef = useMemo<ColDef>(
        () => ({
            resizable: true,
            sortable: true,
        }),
        []
    );

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.title}>대분류</div>
                <div className={styles.headerRight}>
                    <span className={styles.totalText}>전체 {totalCount}건</span>

                    <select
                        className={styles.select}
                        value={size}
                        onChange={(e) => onChangePageSize(Number(e.target.value))}
                    >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </select>

                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={onEdit}
                    >
                        수정
                    </button>

                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={onCreate}
                    >
                        신규
                    </button>
                </div>
            </div>

            <div className={`${gridThemeClass} ${styles.gridWrap}`} style={{ height: gridHeight }}>
                <AgGridReact<CodeGroupRow>
                    theme="legacy"
                    rowData={rows}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowSelection="single"
                    loading={loading}
                    onRowClicked={(e: RowClickedEvent<CodeGroupRow>) => {
                        if (e.data) onSelectRow(e.data);
                    }}
                    onSortChanged={(e: SortChangedEvent) => {
                        const sorted = e.api.getColumnState().find((col) => !!col.sort);
                        const nextSortBy = sorted?.colId ?? "codeGroupSeq";
                        const nextSortDir = (sorted?.sort as "asc" | "desc") ?? "desc";
                        onChangeSort(nextSortBy, nextSortDir);
                    }}
                />
            </div>

            <div className={styles.pagination}>
                <button
                    type="button"
                    className={styles.pageButton}
                    onClick={() => onChangePage(1)}
                    disabled={page <= 1}
                >
                    처음
                </button>

                <button
                    type="button"
                    className={styles.pageButton}
                    onClick={() => onChangePage(page - 1)}
                    disabled={page <= 1}
                >
                    이전
                </button>

                <span className={styles.pageText}>
          {page} / {totalPages}
        </span>

                <button
                    type="button"
                    className={styles.pageButton}
                    onClick={() => onChangePage(page + 1)}
                    disabled={page >= totalPages}
                >
                    다음
                </button>

                <button
                    type="button"
                    className={styles.pageButton}
                    onClick={() => onChangePage(totalPages)}
                    disabled={page >= totalPages}
                >
                    마지막
                </button>
            </div>
        </div>
    );
}