"use client";

import "@/lib/ag-grid";
import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { useTheme } from "next-themes";
import type { ColDef, RowClickedEvent } from "ag-grid-community";
import styles from "./CodeGrid.module.css";
import type { CodeDetailRow } from "../api";

type Props = {
    title: string;
    rows: CodeDetailRow[];
    loading: boolean;
    selectedRow: CodeDetailRow | null;
    onSelectRow: (row: CodeDetailRow) => void;
    onCreate: () => void;
    onEdit: () => void;
    onOpenRowEdit: (row: CodeDetailRow) => void;
    gridHeight?: number;
};

export default function CodeDetailGrid({
                                           title,
                                           rows,
                                           loading,
                                           onSelectRow,
                                           onCreate,
                                           onEdit,
                                           onOpenRowEdit,
                                           gridHeight = 200,
                                       }: Props) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const gridThemeClass = useMemo(() => {
        if (!mounted) return "ag-theme-quartz";
        return resolvedTheme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";
    }, [mounted, resolvedTheme]);

    const columnDefs = useMemo<ColDef[]>(
        () => [
            { headerName: "SEQ", field: "codeDetailSeq", width: 100 },
            {
                headerName: "코드ID",
                field: "codeId",
                width: 140,
                cellRenderer: (params: { data?: CodeDetailRow; value?: string }) => (
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
                headerName: "코드명",
                field: "codeName",
                flex: 1,
                minWidth: 160,
                cellRenderer: (params: { data?: CodeDetailRow; value?: string }) => (
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
            { headerName: "코드값", field: "codeValue", flex: 1, minWidth: 140 },
            { headerName: "정렬", field: "sortOrder", width: 90 },
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
                <div className={styles.title}>{title}</div>
                <div className={styles.headerRight}>
                    <button type="button" className={styles.secondaryButton} onClick={onEdit}>
                        수정
                    </button>
                    <button type="button" className={styles.primaryButton} onClick={onCreate}>
                        신규
                    </button>
                </div>
            </div>

            <div className={`${gridThemeClass} ${styles.gridWrap}`} style={{ height: gridHeight }}>
                <AgGridReact<CodeDetailRow>
                    theme="legacy"
                    rowData={rows}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowSelection="single"
                    loading={loading}
                    onRowClicked={(e: RowClickedEvent<CodeDetailRow>) => {
                        if (e.data) onSelectRow(e.data);
                    }}
                />
            </div>
        </div>
    );
}