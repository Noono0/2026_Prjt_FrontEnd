"use client";

import "@/lib/ag-grid";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, RowClickedEvent } from "ag-grid-community";

import MemberFormModal, { type Member } from "@/components/members/MemberFormModal";
import { useMemberModalStore } from "@/stores/memberModalStore";
import { deleteMembers, saveMember, searchMembers, fetchMemberDetail } from "./api";

type SearchCondition = {
    memberId: string;
    memberName: string;
    roleCode: string;
    status: string;
};

type MemberRow = {
    memberSeq?: number;
    memberId: string;
    memberName: string;
    email?: string;
    phone?: string;
    region?: string;
    roleCode?: string;
    status?: string;
    lastLoginAt?: string;
};

export default function MembersPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [searchCondition, setSearchCondition] = useState<SearchCondition>({
        memberId: "",
        memberName: "",
        roleCode: "",
        status: "",
    });

    const [items, setItems] = useState<MemberRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageSize, setPageSize] = useState(100);

    const gridApiRef = useRef<GridApi<MemberRow> | null>(null);

    const modalOpen = useMemberModalStore((s) => s.open);
    const modalMode = useMemberModalStore((s) => s.mode);
    const selected = useMemberModalStore((s) => s.selected);
    const openCreate = useMemberModalStore((s) => s.openCreate);
    const openEdit = useMemberModalStore((s) => s.openEdit);
    const close = useMemberModalStore((s) => s.close);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === "dark";

    const rows = useMemo<MemberRow[]>(
        () =>
            items.map((m: any) => ({
                memberSeq: m.memberSeq,
                memberId: m.memberId,
                memberName: m.memberName,
                email: m.email,
                phone: m.phone,
                region: m.region,
                roleCode: m.roleCode,
                status: m.status,
                lastLoginAt: m.lastLoginAt,
            })),
        [items]
    );

    const colDefs = useMemo<ColDef<MemberRow>[]>(
        () => [
            {
                headerName: "선택",
                checkboxSelection: true,
                headerCheckboxSelection: true,
                width: 70,
                pinned: "left",
            },
            { headerName: "회원SEQ", field: "memberSeq", width: 100 },
            { headerName: "아이디", field: "memberId", width: 140 },
            { headerName: "회원명", field: "memberName", flex: 1, minWidth: 140 },
            { headerName: "이메일", field: "email", flex: 1, minWidth: 180 },
            { headerName: "휴대폰", field: "phone", width: 150 },
            { headerName: "지역", field: "region", width: 120 },
            { headerName: "권한", field: "roleCode", width: 120 },
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

    const handleChangeCondition = (key: keyof SearchCondition, value: string) => {
        setSearchCondition((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSearch = async () => {
        debugger;
        try {
            setIsLoading(true);

            const list = await searchMembers({
                memberId: searchCondition.memberId || undefined,
                memberName: searchCondition.memberName || undefined,
                roleCode: searchCondition.roleCode || undefined,
                status: searchCondition.status || undefined,
            });

            setItems(list ?? []);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "회원 목록 조회 중 오류가 발생했습니다.";
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setSearchCondition({
            memberId: "",
            memberName: "",
            roleCode: "",
            status: "",
        });
        setItems([]);
    };

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
            const ids = selectedRows.map((row) => row.memberId).filter(Boolean);
            await deleteMembers(ids);
            await handleSearch();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.";
            alert(message);
        }
    };

    const onRowClicked = async (e: RowClickedEvent<MemberRow>) => {
        if (!e.data) return;

        try {
            setIsLoading(true);

            // 상세조회는 memberSeq 기준 권장
            const memberKey = e.data.memberSeq;

            if (!memberKey) {
                alert("선택한 회원의 memberSeq가 없습니다.");
                return;
            }

            const detail = await fetchMemberDetail(memberKey);

            openEdit({
                id: detail.memberId ?? "",
                name: detail.memberName ?? "",
                email: detail.email ?? "",
                phone: detail.phone ?? "",
                region: detail.region ?? "",
                role: detail.roleCode ?? "",
                status: (detail.status as Member["status"]) ?? "ACTIVE",
                lastLoginAt: detail.lastLoginAt ?? "",
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "회원 상세조회 중 오류가 발생했습니다.";
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    const onSave = async (member: Member) => {
        try {
            await saveMember(member, modalMode);
            close();
            await handleSearch();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.";
            alert(message);
        }
    };

    return (
        <div>
            <h1>회원관리</h1>

            <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <label>
                    회원ID{" "}
                    <input
                        value={searchCondition.memberId}
                        onChange={(e) => handleChangeCondition("memberId", e.target.value)}
                        placeholder="회원ID"
                    />
                </label>

                <label>
                    회원명{" "}
                    <input
                        value={searchCondition.memberName}
                        onChange={(e) => handleChangeCondition("memberName", e.target.value)}
                        placeholder="회원명"
                    />
                </label>

                <label>
                    권한{" "}
                    <input
                        value={searchCondition.roleCode}
                        onChange={(e) => handleChangeCondition("roleCode", e.target.value)}
                        placeholder="권한코드"
                    />
                </label>

                <label>
                    상태{" "}
                    <input
                        value={searchCondition.status}
                        onChange={(e) => handleChangeCondition("status", e.target.value)}
                        placeholder="상태코드"
                    />
                </label>

                <button type="button" onClick={handleSearch} disabled={isLoading}>
                    조회
                </button>

                <button type="button" onClick={handleReset} disabled={isLoading}>
                    초기화
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

                <button type="button" onClick={onDelete} disabled={isLoading}>
                    삭제
                </button>
            </div>

            <div
                className={isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"}
                style={{ height: 600 }}
            >
                <AgGridReact<MemberRow>
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