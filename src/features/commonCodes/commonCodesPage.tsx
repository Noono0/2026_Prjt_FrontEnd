"use client";

import { useMemo, useState } from "react";
import styles from "./commonCodesPage.module.css";
import CodeSearchForm from "./components/CodeSearchForm";
import CodeGroupGrid from "./components/CodeGroupGrid";
import CodeDetailGrid from "./components/CodeDetailGrid";
import CodeGroupModal from "./components/CodeGroupModal";
import CodeDetailModal from "./components/CodeDetailModal";
import {
    useCodeDetailsQuery,
    useCodeGroupsQuery,
} from "./queries";
import type {
    CodeDetailRow,
    CodeGroupRow,
    CodeGroupSearchCondition,
} from "./api";

type DetailModalMode = "create-middle" | "edit-middle" | "create-small" | "edit-small";

const defaultSearchCondition: CodeGroupSearchCondition = {
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
    const [searchCondition, setSearchCondition] =
        useState<CodeGroupSearchCondition>(defaultSearchCondition);

    const [selectedGroup, setSelectedGroup] = useState<CodeGroupRow | null>(null);
    const [selectedMiddle, setSelectedMiddle] = useState<CodeDetailRow | null>(null);
    const [selectedSmall, setSelectedSmall] = useState<CodeDetailRow | null>(null);

    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [groupModalMode, setGroupModalMode] = useState<"create" | "edit">("create");

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailModalMode, setDetailModalMode] =
        useState<DetailModalMode>("create-middle");

    const groupQuery = useCodeGroupsQuery(searchCondition);

    const middleCondition = useMemo(
        () => ({
            codeGroupSeq: selectedGroup?.codeGroupSeq,
            codeLevel: 2,
            delYn: "N",
            page: 1,
            size: 200,
            sortBy: "sortOrder",
            sortDir: "asc" as const,
        }),
        [selectedGroup?.codeGroupSeq]
    );

    const middleQuery = useCodeDetailsQuery(middleCondition);

    const smallCondition = useMemo(
        () => ({
            codeGroupSeq: selectedGroup?.codeGroupSeq,
            parentDetailSeq: selectedMiddle?.codeDetailSeq,
            codeLevel: 3,
            delYn: "N",
            page: 1,
            size: 200,
            sortBy: "sortOrder",
            sortDir: "asc" as const,
        }),
        [selectedGroup?.codeGroupSeq, selectedMiddle?.codeDetailSeq]
    );

    const smallQuery = useCodeDetailsQuery(smallCondition);

    const handleSearch = (nextCondition: Partial<CodeGroupSearchCondition>) => {
        setSelectedGroup(null);
        setSelectedMiddle(null);
        setSelectedSmall(null);

        setSearchCondition((prev) => ({
            ...prev,
            ...nextCondition,
            page: 1,
        }));
    };

    const handleReset = () => {
        setSelectedGroup(null);
        setSelectedMiddle(null);
        setSelectedSmall(null);
        setSearchCondition(defaultSearchCondition);
    };

    const handleChangePage = (page: number) => {
        setSearchCondition((prev) => ({ ...prev, page }));
    };

    const handleChangePageSize = (size: number) => {
        setSelectedGroup(null);
        setSelectedMiddle(null);
        setSelectedSmall(null);
        setSearchCondition((prev) => ({ ...prev, page: 1, size }));
    };

    const handleChangeSort = (sortBy: string, sortDir: "asc" | "desc") => {
        setSearchCondition((prev) => ({
            ...prev,
            page: 1,
            sortBy,
            sortDir,
        }));
    };

    const openCreateGroupModal = () => {
        setGroupModalMode("create");
        setGroupModalOpen(true);
    };

    const openEditGroupModal = () => {
        if (!selectedGroup?.codeGroupSeq) {
            alert("수정할 대분류를 선택하세요.");
            return;
        }
        setGroupModalMode("edit");
        setGroupModalOpen(true);
    };

    const openCreateMiddleModal = () => {
        if (!selectedGroup?.codeGroupSeq) {
            alert("대분류를 먼저 선택하세요.");
            return;
        }
        setDetailModalMode("create-middle");
        setDetailModalOpen(true);
    };

    const openEditMiddleModal = () => {
        if (!selectedMiddle?.codeDetailSeq) {
            alert("수정할 중분류를 선택하세요.");
            return;
        }
        setDetailModalMode("edit-middle");
        setDetailModalOpen(true);
    };

    const openCreateSmallModal = () => {
        if (!selectedGroup?.codeGroupSeq || !selectedMiddle?.codeDetailSeq) {
            alert("대분류와 중분류를 먼저 선택하세요.");
            return;
        }
        setDetailModalMode("create-small");
        setDetailModalOpen(true);
    };

    const openEditSmallModal = () => {
        if (!selectedSmall?.codeDetailSeq) {
            alert("수정할 소분류를 선택하세요.");
            return;
        }
        setDetailModalMode("edit-small");
        setDetailModalOpen(true);
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>공통코드 관리</h1>
                    <p className={styles.subTitle}>대분류 / 중분류 / 소분류를 한 화면에서 관리합니다.</p>
                </div>
            </div>

            <CodeSearchForm
                condition={searchCondition}
                onSearch={handleSearch}
                onReset={handleReset}
            />

            <section className={styles.section}>
                <CodeGroupGrid
                    rows={groupQuery.data?.items ?? []}
                    loading={groupQuery.isLoading}
                    totalCount={groupQuery.data?.totalCount ?? 0}
                    page={searchCondition.page ?? 1}
                    size={searchCondition.size ?? 20}
                    selectedRow={selectedGroup}
                    onSelectRow={(row) => {
                        setSelectedGroup(row);
                        setSelectedMiddle(null);
                        setSelectedSmall(null);
                    }}
                    onCreate={openCreateGroupModal}
                    onEdit={openEditGroupModal}
                    onChangePage={handleChangePage}
                    onChangePageSize={handleChangePageSize}
                    onChangeSort={handleChangeSort}
                />
            </section>

            <section className={styles.gridRow}>
                <div className={styles.section}>
                    <CodeDetailGrid
                        title="중분류"
                        rows={middleQuery.data?.items ?? []}
                        loading={middleQuery.isLoading}
                        selectedRow={selectedMiddle}
                        onSelectRow={(row) => {
                            setSelectedMiddle(row);
                            setSelectedSmall(null);
                        }}
                        onCreate={openCreateMiddleModal}
                        onEdit={openEditMiddleModal}
                    />
                </div>

                <div className={styles.section}>
                    <CodeDetailGrid
                        title="소분류"
                        rows={smallQuery.data?.items ?? []}
                        loading={smallQuery.isLoading}
                        selectedRow={selectedSmall}
                        onSelectRow={setSelectedSmall}
                        onCreate={openCreateSmallModal}
                        onEdit={openEditSmallModal}
                    />
                </div>
            </section>

            <CodeGroupModal
                open={groupModalOpen}
                mode={groupModalMode}
                selectedGroup={selectedGroup}
                onClose={() => setGroupModalOpen(false)}
            />

            <CodeDetailModal
                open={detailModalOpen}
                mode={detailModalMode}
                selectedGroup={selectedGroup}
                selectedMiddle={selectedMiddle}
                selectedSmall={selectedSmall}
                onClose={() => setDetailModalOpen(false)}
            />
        </div>
    );
}