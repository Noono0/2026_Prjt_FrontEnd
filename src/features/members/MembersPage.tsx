"use client";

import "@/lib/ag-grid";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, RowClickedEvent } from "ag-grid-community";

import MemberFormModal, { type Member } from "@/components/members/MemberFormModal";
import {
    useDeleteMembersMutation,
    useMembersQuery,
    useSaveMemberMutation,
} from "./queries";
import { useMemberModalStore } from "@/stores/memberModalStore";

type Row = {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    region?: string;
    role?: string;
    status?: string;
    lastLoginAt?: string;
};

export default function MembersPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === "dark";

    const [keyword, setKeyword] = useState("");
    const [pageSize, setPageSize] = useState(100);
    const gridApiRef = useRef<GridApi<Row> | null>(null);

    const { data: items = [], isLoading, refetch } = useMembersQuery(keyword);
    const deleteMutation = useDeleteMembersMutation();

    const modalOpen = useMemberModalStore((s) => s.open);
    const modalMode = useMemberModalStore((s) => s.mode);
    const selected = useMemberModalStore((s) => s.selected);
    const openCreate = useMemberModalStore((s) => s.openCreate);
    const openEdit = useMemberModalStore((s) => s.openEdit);
    const close = useMemberModalStore((s) => s.close);

    const saveMutation = useSaveMemberMutation(modalMode);

    const rows = useMemo<Row[]>(
        () =>
            items.map((m) => ({
                id: m.id,
                name: m.name,
                email: m.email,
                phone: m.phone,
                region: m.region,
                role: m.role,
                status: m.status,
                lastLoginAt: m.lastLoginAt,
            })),
        [items]
    );

    const colDefs = useMemo<ColDef<Row>[]>(
        () => [
            {
                headerName: "선택",
                checkboxSelection: true,
                headerCheckboxSelection: true,
                width: 70,
                pinned: "left",
            },
            { headerName: "아이디", field: "id", width: 120 },
            { headerName: "사용자성명", field: "name", flex: 1, minWidth: 140 },
            { headerName: "이메일", field: "email", flex: 1, minWidth: 180 },
            { headerName: "휴대폰", field: "phone", width: 150 },
            { headerName: "지역", field: "region", width: 120 },
            { headerName: "권한", field: "role", width: 120 },
            { headerName: "상태", field: "status", width: 120 },
            { headerName: "최종접속", field: "lastLoginAt", width: 170 },
        ],
        []
    );

    const defaultColDef = useMemo(
        () => ({
            sortable: true,
            filter: true,
            resizable: true,
        }),
        []
    );

    const onDelete = async () => {
        const selectedRows = gridApiRef.current?.getSelectedRows() ?? [];
        if (selectedRows.length === 0) {
            alert("삭제할 회원을 선택하세요.");
            return;
        }

        if (!confirm(`${selectedRows.length}건 삭제할까요?`)) {
            return;
        }

        try {
            await deleteMutation.mutateAsync(selectedRows.map((r) => r.id));
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.";
            alert(message);
        }
    };

    const onRowClicked = (e: RowClickedEvent<Row>) => {
        if (!e.data) return;

        openEdit({
            id: e.data.id,
            name: e.data.name,
            email: e.data.email,
            phone: e.data.phone,
            region: e.data.region,
            role: e.data.role,
            status: (e.data.status as Member["status"]) ?? "ACTIVE",
            lastLoginAt: e.data.lastLoginAt,
        });
    };

    const onSave = async (member: Member) => {
        try {
            await saveMutation.mutateAsync(member);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.";
            alert(message);
        }
    };

    return (
        <div>
            <h1>회원관리</h1>

            <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <label>
                    검색어{" "}
                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="아이디/이름/이메일"
                    />
                </label>

                <button type="button" onClick={() => refetch()}>
                    조회
                </button>

                <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    aria-label="페이지 사이즈"
                >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                </select>

                <button type="button" onClick={openCreate}>
                    등록
                </button>

                <button type="button" onClick={onDelete} disabled={deleteMutation.isPending}>
                    삭제
                </button>
            </div>

            <div
                className={isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"}
                style={{ height: 600 }}
            >
                <AgGridReact<Row>
                    theme="legacy"
                    rowData={rows}
                    columnDefs={colDefs}
                    defaultColDef={defaultColDef}
                    pagination
                    paginationPageSize={pageSize}
                    rowSelection={{ mode: "multiRow", checkboxes: true, headerCheckbox: true }}
                    animateRows
                    loading={isLoading}
                    onGridReady={(e) => {
                        gridApiRef.current = e.api;
                    }}
                    onRowClicked={onRowClicked}
                />
            </div>

            <MemberFormModal
                open={modalOpen}
                mode={modalMode}
                initial={selected}
                onClose={close}
                onSave={onSave}
            />
        </div>
    );
}