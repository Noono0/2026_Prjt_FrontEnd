"use client";

import { useMemo, useState } from "react";
import CodeSearchForm from "./components/CodeSearchForm";
import CodeGroupGrid from "./components/CodeGroupGrid";
import CodeDetailGrid from "./components/CodeDetailGrid";
import CodeGroupModal from "./components/CodeGroupModal";
import CodeDetailModal from "./components/CodeDetailModal";
import SelectedCodeInfoPanel from "./components/SelectedCodeInfoPanel";
import styles from "./commonCodesPage.module.css";
import type { CodeGroupRow, CodeDetailRow, CodeGroupSearchCondition, CodeDetailSearchCondition } from "./api";
import { commonCodeKeys, useCodeDetailsQuery, useCodeGroupsQuery } from "./queries";
import { useQueryClient } from "@tanstack/react-query";
import { normalizeCodeGroupSearchCondition, sameCodeGroupSearchCondition } from "@/lib/query/searchConditions";

const defaultGroupCondition: CodeGroupSearchCondition = {
    codeGroupId: "",
    codeGroupName: "",
    useYn: "",
    delYn: "N",
    page: 1,
    size: 20,
    sortBy: "codeGroupSeq",
    sortDir: "desc",
};

export default function CommonCodesPage() {
    const queryClient = useQueryClient();
    const [groupCondition, setGroupCondition] = useState<CodeGroupSearchCondition>(defaultGroupCondition);

    const [selectedGroup, setSelectedGroup] = useState<CodeGroupRow | null>(null);
    const [selectedMiddle, setSelectedMiddle] = useState<CodeDetailRow | null>(null);
    const [selectedSmall, setSelectedSmall] = useState<CodeDetailRow | null>(null);
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [groupModalMode, setGroupModalMode] = useState<"create" | "edit">("create");
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailModalMode, setDetailModalMode] = useState<
        "create-middle" | "edit-middle" | "create-small" | "edit-small"
    >("create-middle");

    const normalizedGroupCondition = useMemo(() => normalizeCodeGroupSearchCondition(groupCondition), [groupCondition]);

    const groupQuery = useCodeGroupsQuery(normalizedGroupCondition);

    const middleCondition = useMemo<CodeDetailSearchCondition>(
        () => ({
            codeGroupSeq: selectedGroup?.codeGroupSeq,
            codeLevel: 2,
            delYn: "N",
            page: 1,
            size: 999,
            sortBy: "sortOrder",
            sortDir: "asc",
        }),
        [selectedGroup?.codeGroupSeq]
    );

    const smallCondition = useMemo<CodeDetailSearchCondition>(
        () => ({
            codeGroupSeq: selectedGroup?.codeGroupSeq,
            parentDetailSeq: selectedMiddle?.codeDetailSeq,
            codeLevel: 3,
            delYn: "N",
            page: 1,
            size: 999,
            sortBy: "sortOrder",
            sortDir: "asc",
        }),
        [selectedGroup?.codeGroupSeq, selectedMiddle?.codeDetailSeq]
    );

    const middleQuery = useCodeDetailsQuery(middleCondition);
    const smallQuery = useCodeDetailsQuery(smallCondition);

    const groupListBusy = groupQuery.isFetching;

    const handleSearch = async (next: Partial<CodeGroupSearchCondition>) => {
        setSelectedGroup(null);
        setSelectedMiddle(null);
        setSelectedSmall(null);

        const nextRaw: CodeGroupSearchCondition = {
            ...groupCondition,
            ...next,
            page: 1,
        };

        if (sameCodeGroupSearchCondition(groupCondition, nextRaw)) {
            await groupQuery.refetch();
            return;
        }

        setGroupCondition(nextRaw);
    };

    const handleReset = () => {
        setSelectedGroup(null);
        setSelectedMiddle(null);
        setSelectedSmall(null);
        setGroupCondition(defaultGroupCondition);
    };

    const handleOpenGroupCreate = () => {
        setGroupModalMode("create");
        setGroupModalOpen(true);
    };

    const handleOpenGroupEdit = () => {
        if (!selectedGroup?.codeGroupSeq) {
            alert("수정할 대분류를 선택하세요.");
            return;
        }
        setGroupModalMode("edit");
        setGroupModalOpen(true);
    };

    const handleOpenMiddleCreate = () => {
        if (!selectedGroup?.codeGroupSeq) {
            alert("대분류를 먼저 선택하세요.");
            return;
        }
        setDetailModalMode("create-middle");
        setDetailModalOpen(true);
    };

    const handleOpenMiddleEdit = () => {
        if (!selectedMiddle?.codeDetailSeq) {
            alert("수정할 중분류를 선택하세요.");
            return;
        }
        setDetailModalMode("edit-middle");
        setDetailModalOpen(true);
    };

    const handleOpenGroupEditByRow = (row: CodeGroupRow) => {
        setSelectedGroup(row);
        setSelectedMiddle(null);
        setSelectedSmall(null);
        setGroupModalMode("edit");
        setGroupModalOpen(true);
    };

    const handleOpenMiddleEditByRow = (row: CodeDetailRow) => {
        setSelectedMiddle(row);
        setSelectedSmall(null);
        setDetailModalMode("edit-middle");
        setDetailModalOpen(true);
    };

    const handleOpenSmallEditByRow = (row: CodeDetailRow) => {
        setSelectedSmall(row);
        setDetailModalMode("edit-small");
        setDetailModalOpen(true);
    };

    const handleOpenSmallCreate = () => {
        if (!selectedGroup?.codeGroupSeq) {
            alert("대분류를 먼저 선택하세요.");
            return;
        }
        if (!selectedMiddle?.codeDetailSeq) {
            alert("상위 중분류를 먼저 선택하세요.");
            return;
        }
        setDetailModalMode("create-small");
        setDetailModalOpen(true);
    };

    const handleOpenSmallEdit = () => {
        if (!selectedSmall?.codeDetailSeq) {
            alert("수정할 소분류를 선택하세요.");
            return;
        }
        setDetailModalMode("edit-small");
        setDetailModalOpen(true);
    };

    const handleCloseGroupModal = async () => {
        setGroupModalOpen(false);
        await queryClient.invalidateQueries({ queryKey: commonCodeKeys.groups });
    };

    const handleCloseDetailModal = async () => {
        setDetailModalOpen(false);
        await queryClient.invalidateQueries({ queryKey: commonCodeKeys.details });
    };

    return (
        <div className={styles.page}>
            <CodeSearchForm
                condition={groupCondition}
                onSearch={handleSearch}
                onReset={handleReset}
                isBusy={groupListBusy}
            />

            <CodeGroupGrid
                rows={groupQuery.data?.items ?? []}
                loading={groupQuery.isLoading || groupQuery.isFetching}
                totalCount={groupQuery.data?.totalCount ?? 0}
                page={groupCondition.page ?? 1}
                size={groupCondition.size ?? 20}
                selectedRow={selectedGroup}
                onSelectRow={(row) => {
                    setSelectedGroup(row);
                    setSelectedMiddle(null);
                    setSelectedSmall(null);
                }}
                onCreate={handleOpenGroupCreate}
                onEdit={handleOpenGroupEdit}
                onChangePage={(page) => setGroupCondition((prev) => ({ ...prev, page }))}
                onChangePageSize={(size) => setGroupCondition((prev) => ({ ...prev, page: 1, size }))}
                onChangeSort={(sortBy, sortDir) =>
                    setGroupCondition((prev) => ({
                        ...prev,
                        page: 1,
                        sortBy,
                        sortDir,
                    }))
                }
                onOpenRowEdit={handleOpenGroupEditByRow}
                gridHeight={230}
            />

            <div className={styles.detailRow}>
                <CodeDetailGrid
                    title="중분류"
                    rows={middleQuery.data?.items ?? []}
                    loading={middleQuery.isLoading || middleQuery.isFetching}
                    selectedRow={selectedMiddle}
                    onSelectRow={(row) => {
                        setSelectedMiddle(row);
                        setSelectedSmall(null);
                    }}
                    onCreate={handleOpenMiddleCreate}
                    onEdit={handleOpenMiddleEdit}
                    onOpenRowEdit={handleOpenMiddleEditByRow}
                    gridHeight={200}
                />

                <CodeDetailGrid
                    title="소분류"
                    rows={smallQuery.data?.items ?? []}
                    loading={smallQuery.isLoading || smallQuery.isFetching}
                    selectedRow={selectedSmall}
                    onSelectRow={setSelectedSmall}
                    onCreate={handleOpenSmallCreate}
                    onEdit={handleOpenSmallEdit}
                    onOpenRowEdit={handleOpenSmallEditByRow}
                    gridHeight={200}
                />
            </div>

            <SelectedCodeInfoPanel
                selectedGroup={selectedGroup}
                selectedMiddle={selectedMiddle}
                selectedSmall={selectedSmall}
            />

            <CodeGroupModal
                open={groupModalOpen}
                mode={groupModalMode}
                selectedGroup={selectedGroup}
                onClose={handleCloseGroupModal}
            />

            <CodeDetailModal
                open={detailModalOpen}
                mode={detailModalMode}
                selectedGroup={selectedGroup}
                selectedMiddle={selectedMiddle}
                selectedSmall={selectedSmall}
                onClose={handleCloseDetailModal}
            />
        </div>
    );
}
