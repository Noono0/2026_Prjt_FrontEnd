"use client";

import "@/lib/ag-grid";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AgGridReact } from "ag-grid-react";
import { useRolesQuery } from "@/features/members/queries";
import styles from "./MembersPage.module.css";

import type {
    ColDef,
    GridApi,
    GridReadyEvent,
    RowClickedEvent,
    SortChangedEvent,
    ValueGetterParams,
} from "ag-grid-community";

import MemberFormModal, { type Member } from "@/components/members/MemberFormModal";
import { useMemberModalStore } from "@/stores/memberModalStore";
import {
    deleteMembers,
    fetchMemberDetail,
    saveMember,
    searchMembers,
    type MemberListItemResponse,
} from "./api";

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
    birthYmd?: string;
    email?: string;
    gender?: string;
    phone?: string;
    roleCode?: string;
    roleName?: string;
    status?: string;
    createDt?: string;
    modifyDt?: string;
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

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);

    const [sortBy, setSortBy] = useState("memberSeq");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const gridApiRef = useRef<GridApi<MemberRow> | null>(null);

    const modalOpen = useMemberModalStore((s) => s.open);
    const modalMode = useMemberModalStore((s) => s.mode);
    const selected = useMemberModalStore((s) => s.selected);
    const openCreate = useMemberModalStore((s) => s.openCreate);
    const openEdit = useMemberModalStore((s) => s.openEdit);
    const close = useMemberModalStore((s) => s.close);

    const { data: roleOptions = [] } = useRolesQuery();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === "dark";

    const roleNameMap = useMemo(() => {
        const map = new Map<string, string>();

        roleOptions.forEach((r: any) => {
            const code = r.roleCode ?? r.role_code ?? "";
            const name = r.roleName ?? r.role_name ?? "";
            if (code) {
                map.set(code, name || code);
            }
        });

        return map;
    }, [roleOptions]);

    const rows = useMemo<MemberRow[]>(
        () =>
            (items ?? []).map((m: MemberListItemResponse) => ({
                memberSeq: m.memberSeq,
                memberId: m.memberId ?? "",
                memberName: m.memberName ?? "",
                birthYmd: m.birthYmd ?? "",
                email: m.email ?? "",
                gender: m.gender ?? "",
                phone: m.phone ?? "",
                roleCode: m.roleCode ?? "",
                roleName: m.roleName ?? "",
                status: m.status ?? "",
                createDt: m.createDt ?? "",
                modifyDt: m.modifyDt ?? "",
            })),
        [items]
    );

    const colDefs = useMemo<ColDef<MemberRow>[]>(
        () => [
            {
                headerName: "",
                checkboxSelection: true,
                headerCheckboxSelection: true,
                width: 55,
                pinned: "left",
                sortable: false,
                filter: false,
                resizable: false,
            },
            { headerName: "회원SEQ", field: "memberSeq", width: 100, sort: "desc" },
            { headerName: "아이디", field: "memberId", width: 140 },
            { headerName: "회원명", field: "memberName", width: 140 },
            { headerName: "생년월일", field: "birthYmd", width: 120 },
            { headerName: "이메일", field: "email", minWidth: 220, flex: 1 },
            { headerName: "성별", field: "gender", width: 90 },
            { headerName: "휴대폰번호", field: "phone", width: 150 },
            {
                headerName: "권한",
                field: "roleCode",
                width: 140,
                valueGetter: (params: ValueGetterParams<MemberRow>) => {
                    const code = params.data?.roleCode ?? "";
                    return params.data?.roleName || roleNameMap.get(code) || code;
                },
            },
            { headerName: "상태", field: "status", width: 120 },
            { headerName: "등록일시", field: "createDt", width: 180 },
            { headerName: "수정일시", field: "modifyDt", width: 180 },
        ],
        [roleNameMap]
    );

    const defaultColDef = useMemo<ColDef<MemberRow>>(
        () => ({
            sortable: true,
            filter: false,
            resizable: true,
        }),
        []
    );

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const handleChangeCondition = (key: keyof SearchCondition, value: string) => {
        setSearchCondition((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const loadMembers = async (
        nextPage = page,
        nextSize = pageSize,
        nextSortBy = sortBy,
        nextSortDir = sortDir
    ) => {
        try {
            setIsLoading(true);

            const result = await searchMembers({
                memberId: searchCondition.memberId || undefined,
                memberName: searchCondition.memberName || undefined,
                roleCode: searchCondition.roleCode || undefined,
                status: searchCondition.status || undefined,
                page: nextPage,
                size: nextSize,
                sortBy: nextSortBy,
                sortDir: nextSortDir,
            });

            setItems((result.items ?? []) as MemberRow[]);
            setTotalCount(result.totalCount ?? 0);
            setPage(result.page ?? nextPage);
            setPageSize(result.size ?? nextSize);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "회원 목록 조회 중 오류가 발생했습니다.";
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        await loadMembers(1, pageSize, sortBy, sortDir);
    };

    const handleReset = async () => {
        setSearchCondition({
            memberId: "",
            memberName: "",
            roleCode: "",
            status: "",
        });

        try {
            setIsLoading(true);

            const result = await searchMembers({
                page: 1,
                size: pageSize,
                sortBy,
                sortDir,
            });

            setItems((result.items ?? []) as MemberRow[]);
            setTotalCount(result.totalCount ?? 0);
            setPage(result.page ?? 1);
            setPageSize(result.size ?? pageSize);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "회원 목록 조회 중 오류가 발생했습니다.";
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        const selectedRows = gridApiRef.current?.getSelectedRows() ?? [];

        if (selectedRows.length === 0) {
            alert("삭제할 회원을 선택하세요.");
            return;
        }

        if (!confirm(`${selectedRows.length}건 삭제할까요?`)) {
            return;
        }

        try {
            const memberSeqList = selectedRows
                .map((row) => row.memberSeq)
                .filter((v): v is number => typeof v === "number");

            await deleteMembers(memberSeqList);

            const remainCount = Math.max(0, totalCount - memberSeqList.length);
            const lastPage = Math.max(1, Math.ceil(remainCount / pageSize));
            const nextPage = Math.min(page, lastPage);

            await loadMembers(nextPage, pageSize, sortBy, sortDir);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "회원 삭제 중 오류가 발생했습니다.";
            alert(message);
        }
    };

    const handleRowClicked = async (event: RowClickedEvent<MemberRow>) => {
        const row = event.data;
        if (!row?.memberSeq) return;

        try {
            setIsLoading(true);

            const detail = await fetchMemberDetail(row.memberSeq);

            openEdit({
                memberSeq: detail.memberSeq,
                memberId: detail.memberId ?? "",
                memberName: detail.memberName ?? "",
                memberPwd: "",
                birthYmd: detail.birthYmd ?? "",
                gender: (detail.gender as Member["gender"]) ?? "M",
                phone: detail.phone ?? "",
                email: detail.email ?? "",
                region: detail.region ?? "",
                roleCode: detail.roleCode ?? "",
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

    const handleSave = async (member: Member) => {
        try {
            await saveMember(member, modalMode);
            close();
            await loadMembers(page, pageSize, sortBy, sortDir);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "회원 저장 중 오류가 발생했습니다.";
            alert(message);
        }
    };

    const handleSortChanged = async (event: SortChangedEvent<MemberRow>) => {
        const sortModel = event.api.getColumnState().find((col) => col.sort);

        const nextSortBy = sortModel?.colId ?? "memberSeq";
        const nextSortDir = (sortModel?.sort as "asc" | "desc") ?? "desc";

        setSortBy(nextSortBy);
        setSortDir(nextSortDir);

        await loadMembers(1, pageSize, nextSortBy, nextSortDir);
    };

    const handlePageSizeChange = async (value: number) => {
        setPageSize(value);
        await loadMembers(1, value, sortBy, sortDir);
    };

    useEffect(() => {
        loadMembers(1, pageSize, sortBy, sortDir);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.page}>
            <h2 className={styles.title}>회원관리</h2>

            <div className={styles.searchGrid}>
                <div>
                    <div className={styles.label}>회원ID</div>
                    <input
                        className={styles.fullInput}
                        value={searchCondition.memberId}
                        onChange={(e) => handleChangeCondition("memberId", e.target.value)}
                        placeholder="회원ID"
                    />
                </div>

                <div>
                    <div className={styles.label}>회원명</div>
                    <input
                        className={styles.fullInput}
                        value={searchCondition.memberName}
                        onChange={(e) => handleChangeCondition("memberName", e.target.value)}
                        placeholder="회원명"
                    />
                </div>

                <div>
                    <div className={styles.label}>권한</div>
                    <select
                        className={styles.fullInput}
                        value={searchCondition.roleCode}
                        onChange={(e) => handleChangeCondition("roleCode", e.target.value)}
                    >
                        <option value="">전체</option>
                        {roleOptions.map((r: any) => {
                            const code = r.roleCode ?? r.role_code ?? "";
                            const name = r.roleName ?? r.role_name ?? "";
                            return (
                                <option key={code} value={code}>
                                    {name}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div>
                    <div className={styles.label}>상태</div>
                    <select
                        className={styles.fullInput}
                        value={searchCondition.status}
                        onChange={(e) => handleChangeCondition("status", e.target.value)}
                    >
                        <option value="">전체</option>
                        <option value="ACTIVE">정상</option>
                        <option value="SUSPENDED">정지</option>
                        <option value="WITHDRAWN">탈퇴</option>
                    </select>
                </div>
            </div>

            <div className={styles.toolbar}>
                <button type="button" onClick={handleSearch} disabled={isLoading}>
                    조회
                </button>
                <button type="button" onClick={handleReset} disabled={isLoading}>
                    초기화
                </button>
                <button type="button" onClick={openCreate} disabled={isLoading}>
                    등록
                </button>
                <button type="button" onClick={handleDelete} disabled={isLoading}>
                    삭제
                </button>

                <div className={styles.spacer}>
                    <span>페이지 크기</span>
                    <select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))}>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </select>
                </div>
            </div>

            <div className={styles.pageInfo}>
        <span>
          전체 {totalCount}건 / {page} / {totalPages} 페이지
        </span>
            </div>

            <div className={`${isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"} ${styles.gridWrap}`}>
                <AgGridReact<MemberRow>
                    theme="legacy"
                    rowData={rows}
                    columnDefs={colDefs}
                    defaultColDef={defaultColDef}
                    animateRows
                    rowSelection="multiple"
                    suppressRowClickSelection={false}
                    suppressPaginationPanel
                    onGridReady={(event: GridReadyEvent<MemberRow>) => {
                        gridApiRef.current = event.api;
                    }}
                    onRowClicked={handleRowClicked}
                    onSortChanged={handleSortChanged}
                    overlayLoadingTemplate={'<span class="ag-overlay-loading-center">조회중...</span>'}
                    overlayNoRowsTemplate={'<span class="ag-overlay-loading-center">데이터가 없습니다.</span>'}
                />
            </div>

            <div className={styles.paginationBar}>
                <button onClick={() => loadMembers(1, pageSize, sortBy, sortDir)} disabled={page <= 1 || isLoading}>
                    처음
                </button>
                <button onClick={() => loadMembers(page - 1, pageSize, sortBy, sortDir)} disabled={page <= 1 || isLoading}>
                    이전
                </button>
                <span>
          {page} / {totalPages}
        </span>
                <button
                    onClick={() => loadMembers(page + 1, pageSize, sortBy, sortDir)}
                    disabled={page >= totalPages || isLoading}
                >
                    다음
                </button>
                <button
                    onClick={() => loadMembers(totalPages, pageSize, sortBy, sortDir)}
                    disabled={page >= totalPages || isLoading}
                >
                    마지막
                </button>
            </div>

            <MemberFormModal
                open={modalOpen}
                mode={modalMode}
                initial={selected}
                onClose={close}
                onSave={handleSave}
            />
        </div>
    );
}