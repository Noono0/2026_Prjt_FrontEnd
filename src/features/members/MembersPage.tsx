"use client";

import "@/lib/ag-grid";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AgGridReact } from "ag-grid-react";
import styles from "./MembersPage.module.css";

import type { ColDef, GridApi, GridReadyEvent, SortChangedEvent, ValueGetterParams } from "ag-grid-community";

import MemberFormModal from "@/components/members/MemberFormModal";
import type { Member } from "@/components/members/memberTypes";
import { useMemberModalStore } from "@/stores/memberModalStore";
import { fetchMemberDetail, memberPrimaryRoleCode, type MemberListItemResponse } from "./api";
import { useDeleteMembersMutation, useMembersQuery, useRolesQuery, useSaveMemberMutation } from "./queries";
import { normalizeMemberSearchCondition, sameMemberSearchCondition } from "@/lib/query/searchConditions";

type MemberFilters = {
    memberId: string;
    memberName: string;
    roleCode: string;
    status: string;
};

type MemberListParams = {
    filters: MemberFilters;
    page: number;
    size: number;
    sortBy: string;
    sortDir: "asc" | "desc";
};

type MemberRow = {
    memberSeq?: number;
    memberId: string;
    memberName: string;
    nickname?: string;
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

const defaultFilters: MemberFilters = {
    memberId: "",
    memberName: "",
    roleCode: "",
    status: "",
};

const initialListParams: MemberListParams = {
    filters: defaultFilters,
    page: 1,
    size: 20,
    sortBy: "memberSeq",
    sortDir: "desc",
};

function toListRequest(params: MemberListParams) {
    return normalizeMemberSearchCondition({
        memberId: params.filters.memberId,
        memberName: params.filters.memberName,
        roleCode: params.filters.roleCode,
        status: params.filters.status,
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
    });
}

export default function MembersPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [draftFilters, setDraftFilters] = useState<MemberFilters>(defaultFilters);
    const [listParams, setListParams] = useState<MemberListParams>(initialListParams);

    const [detailLoading, setDetailLoading] = useState(false);

    const gridApiRef = useRef<GridApi<MemberRow> | null>(null);

    const modalOpen = useMemberModalStore((s) => s.open);
    const modalMode = useMemberModalStore((s) => s.mode);
    const selected = useMemberModalStore((s) => s.selected);
    const openCreate = useMemberModalStore((s) => s.openCreate);
    const openEdit = useMemberModalStore((s) => s.openEdit);
    const close = useMemberModalStore((s) => s.close);

    const listRequest = useMemo(() => toListRequest(listParams), [listParams]);

    const membersQuery = useMembersQuery(listRequest);
    const saveMutation = useSaveMemberMutation();
    const deleteMutation = useDeleteMembersMutation();

    const { data: roleOptions = [] } = useRolesQuery();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!membersQuery.isError || !membersQuery.error) return;
        const message =
            membersQuery.error instanceof Error ? membersQuery.error.message : "회원 목록 조회 중 오류가 발생했습니다.";
        alert(message);
    }, [membersQuery.isError, membersQuery.error]);

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

    const page = listParams.page;
    const pageSize = listParams.size;
    const totalCount = membersQuery.data?.totalCount ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const items = useMemo<MemberRow[]>(() => {
        const raw = membersQuery.data?.items ?? [];
        return raw.map((m: MemberListItemResponse) => {
            const code = memberPrimaryRoleCode(m);
            return {
                memberSeq: m.memberSeq,
                memberId: m.memberId ?? "",
                memberName: m.memberName ?? "",
                nickname: m.nickname ?? "",
                birthYmd: m.birthYmd ?? "",
                email: m.email ?? "",
                gender: m.gender ?? "",
                phone: m.phone ?? "",
                roleCode: code,
                roleName: "",
                status: m.statusCode ?? m.status ?? "",
                createDt: m.createDt ?? "",
                modifyDt: m.modifyDt ?? "",
            };
        });
    }, [membersQuery.data?.items]);

    const busy = membersQuery.isFetching || deleteMutation.isPending || saveMutation.isPending || detailLoading;

    const handleOpenDetail = useCallback(
        async (row: MemberRow) => {
            if (!row?.memberSeq) return;

            try {
                setDetailLoading(true);

                const detail = await fetchMemberDetail(row.memberSeq);
                const code = memberPrimaryRoleCode(detail);

                openEdit({
                    memberSeq: detail.memberSeq,
                    memberId: detail.memberId ?? "",
                    memberName: detail.memberName ?? "",
                    memberPwd: "",
                    birthYmd: detail.birthYmd ?? "",
                    gender: (detail.gender as Member["gender"]) ?? "M",
                    phone: detail.phone ?? "",
                    email: detail.email ?? "",
                    profileImageUrl: detail.profileImageUrl ?? null,
                    profileImageFileSeq: detail.profileImageFileSeq ?? null,
                    region: detail.region ?? "",
                    roleCode: code,
                    roleName: roleNameMap.get(code) ?? detail.roleName ?? "",
                    status: (detail.statusCode ?? detail.status ?? "ACTIVE") as Member["status"],
                    lastLoginAt: detail.lastLoginAt ?? "",
                    streamerProfile: {
                        instagramUrl: detail.streamerProfile?.instagramUrl ?? "",
                        youtubeUrl: detail.streamerProfile?.youtubeUrl ?? "",
                        soopChannelUrl: detail.streamerProfile?.soopChannelUrl ?? "",
                        companyCategoryCode: detail.streamerProfile?.companyCategoryCode ?? "",
                        bloodType: detail.streamerProfile?.bloodType ?? "",
                        careerHistory: detail.streamerProfile?.careerHistory ?? "",
                    },
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : "회원 상세조회 중 오류가 발생했습니다.";
                alert(message);
            } finally {
                setDetailLoading(false);
            }
        },
        [openEdit, roleNameMap]
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
            {
                headerName: "아이디",
                field: "memberId",
                width: 140,
                cellRenderer: (params: any) => {
                    const memberId = params.value ?? "";
                    return (
                        <span
                            className={styles.linkText}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(params.data);
                            }}
                        >
                            {memberId}
                        </span>
                    );
                },
            },
            { headerName: "회원명", field: "memberName", width: 140 },
            { headerName: "닉네임", field: "nickname", width: 120 },
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
        [roleNameMap, handleOpenDetail]
    );

    const defaultColDef = useMemo<ColDef<MemberRow>>(
        () => ({
            sortable: true,
            filter: false,
            resizable: true,
        }),
        []
    );

    const handleChangeDraft = (key: keyof MemberFilters, value: string) => {
        setDraftFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSearch = async () => {
        const nextListParams: MemberListParams = {
            ...listParams,
            filters: { ...draftFilters },
            page: 1,
        };

        const nextReq = toListRequest(nextListParams);
        const curReq = toListRequest(listParams);

        if (sameMemberSearchCondition(nextReq, curReq) && listParams.page === 1) {
            await membersQuery.refetch();
            return;
        }

        setListParams(nextListParams);
    };

    const handleReset = () => {
        setDraftFilters(defaultFilters);
        setListParams(initialListParams);
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

        const memberSeqList = selectedRows
            .map((row) => row.memberSeq)
            .filter((v): v is number => typeof v === "number");

        const lenBefore = items.length;

        try {
            await deleteMutation.mutateAsync(memberSeqList);
            if (page > 1 && lenBefore === 1) {
                setListParams((p) => ({ ...p, page: p.page - 1 }));
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "회원 삭제 중 오류가 발생했습니다.";
            alert(message);
        }
    };

    const handleSave = async (member: Member) => {
        try {
            await saveMutation.mutateAsync({ member, mode: modalMode });
            close();
        } catch (error) {
            const message = error instanceof Error ? error.message : "회원 저장 중 오류가 발생했습니다.";
            alert(message);
        }
    };

    const handleSortChanged = async (event: SortChangedEvent<MemberRow>) => {
        const sortModel = event.api.getColumnState().find((col) => col.sort);
        const colId = sortModel?.colId ?? "memberSeq";
        const nextSortBy = colId === "status" ? "statusCode" : colId;
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
            <h2 className={styles.title}>회원관리</h2>

            <div className={styles.sectionTitle}>검색 조건</div>
            <div className={styles.searchGrid}>
                <div>
                    <div className={styles.label}>회원ID</div>
                    <input
                        className={styles.fullInput}
                        value={draftFilters.memberId}
                        onChange={(e) => handleChangeDraft("memberId", e.target.value)}
                        placeholder="회원ID"
                    />
                </div>

                <div>
                    <div className={styles.label}>회원명</div>
                    <input
                        className={styles.fullInput}
                        value={draftFilters.memberName}
                        onChange={(e) => handleChangeDraft("memberName", e.target.value)}
                        placeholder="회원명"
                    />
                </div>

                <div>
                    <div className={styles.label}>권한</div>
                    <select
                        className={styles.fullInput}
                        value={draftFilters.roleCode}
                        onChange={(e) => handleChangeDraft("roleCode", e.target.value)}
                    >
                        <option value="">전체</option>
                        {roleOptions.map((r: any) => {
                            const code = r.roleCode ?? r.role_code ?? "";
                            const name = r.roleName ?? r.role_name ?? "";
                            return (
                                <option key={code} value={code}>
                                    {name || code}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div>
                    <div className={styles.label}>상태</div>
                    <select
                        className={styles.fullInput}
                        value={draftFilters.status}
                        onChange={(e) => handleChangeDraft("status", e.target.value)}
                    >
                        <option value="">전체</option>
                        <option value="ACTIVE">정상</option>
                        <option value="SUSPENDED">정지</option>
                        <option value="WITHDRAWN">탈퇴</option>
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
                <button type="button" onClick={openCreate} disabled={busy}>
                    등록
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
                        <option value={200}>200</option>
                    </select>
                </div>
            </div>

            <div className={styles.pageInfo}>
                <span>
                    전체 {totalCount}건 / {page} / {totalPages} 페이지
                </span>
            </div>

            <div className={styles.sectionTitle}>회원 목록</div>
            <div className={`${isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"} ${styles.gridWrap}`}>
                <AgGridReact<MemberRow>
                    theme="legacy"
                    rowData={items}
                    columnDefs={colDefs}
                    defaultColDef={defaultColDef}
                    animateRows
                    rowSelection="multiple"
                    suppressRowClickSelection={true}
                    suppressPaginationPanel
                    onGridReady={(event: GridReadyEvent<MemberRow>) => {
                        gridApiRef.current = event.api;
                    }}
                    onSortChanged={handleSortChanged}
                    overlayLoadingTemplate={'<span class="ag-overlay-loading-center">조회중...</span>'}
                    overlayNoRowsTemplate={'<span class="ag-overlay-loading-center">데이터가 없습니다.</span>'}
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

            <MemberFormModal open={modalOpen} mode={modalMode} initial={selected} onClose={close} onSave={handleSave} />
        </div>
    );
}
