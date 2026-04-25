"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tree, type NodeApi } from "react-arborist";
import { FileText, Folder, GripVertical } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import pageStyles from "@/features/members/MembersPage.module.css";
import { type MenuRow, reorderMenus } from "./api";
import {
    buildMenuTree,
    cloneMenuTree,
    diffMenus,
    flattenTree,
    mergeStructureIntoOriginal,
    nextSortOrderForParent,
    type MenuNode,
} from "./arboristUtils";
import { menuAdminKeys, useDeleteMenuMutation, useMenuTreeQuery, useSaveMenuMutation } from "./queries";
import MenuModal from "./components/MenuModal";
import styles from "./menusTree.module.css";

function ExplorerNode({
    node,
    style,
    dragHandle,
    selectedId,
    onSelect,
    onEdit,
}: {
    node: NodeApi<MenuNode>;
    style: React.CSSProperties;
    dragHandle?: (el: HTMLDivElement | null) => void;
    selectedId?: number;
    onSelect: (row: MenuRow) => void;
    onEdit: (row: MenuRow) => void;
}) {
    const row = node.data.data;
    const selected = selectedId === row.menuId;
    const inactive = row.useYn === "N";

    return (
        <div
            style={style}
            className={`${styles.treeRow} ${selected ? styles.treeRowSelected : ""} ${
                inactive ? styles.treeRowInactive : ""
            }`}
            onClick={() => onSelect(row)}
            onDoubleClick={() => onEdit(row)}
        >
            {node.isInternal ? (
                <button
                    type="button"
                    className={styles.arrowButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        node.toggle();
                    }}
                >
                    {node.isOpen ? "▾" : "▸"}
                </button>
            ) : (
                <span className={styles.arrowPlaceholder} />
            )}

            <span className={styles.folderIcon}>
                {node.isInternal ? (
                    <Folder size={16} strokeWidth={2} aria-hidden />
                ) : (
                    <FileText size={16} strokeWidth={2} aria-hidden />
                )}
            </span>

            <span className={styles.label}>
                {row.menuName}
                {inactive && <span className={`${styles.badge} ${styles.badgeInactive}`}>미사용</span>}
            </span>

            <span className={styles.meta}>{row.menuCode}</span>

            <div ref={dragHandle} className={styles.dragHandle} title="드래그하여 순서·위치 변경">
                <GripVertical size={16} strokeWidth={2} />
            </div>
        </div>
    );
}

export default function MenusPage() {
    const queryClient = useQueryClient();
    /** react-arborist onMove 가 연속 호출되며 중복 저장·에러 알림 나는 것 방지 */
    const dragSaveLockRef = useRef(false);

    const menusQuery = useMenuTreeQuery();
    const saveMutation = useSaveMenuMutation();
    const deleteMutation = useDeleteMenuMutation();

    const [selectedRow, setSelectedRow] = useState<MenuRow | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [modalInitial, setModalInitial] = useState<MenuRow | null>(null);

    const flatMenus = useMemo(() => menusQuery.data ?? [], [menusQuery.data]);
    const treeData = useMemo(() => buildMenuTree(flatMenus), [flatMenus]);

    useEffect(() => {
        if (!menusQuery.isError || !menusQuery.error) return;
        const message =
            menusQuery.error instanceof Error ? menusQuery.error.message : "메뉴 목록 조회 중 오류가 발생했습니다.";
        alert(message);
    }, [menusQuery.isError, menusQuery.error]);

    const busy = menusQuery.isFetching || deleteMutation.isPending || saveMutation.isPending;

    const openCreate = useCallback(
        (parent: MenuRow | null) => {
            const pid = parent?.menuId;
            const sort = nextSortOrderForParent(flatMenus, pid);
            setModalMode("create");
            setModalInitial({
                parentMenuId: pid,
                sortOrder: sort,
                useYn: "Y",
            });
            setModalOpen(true);
        },
        [flatMenus]
    );

    const handleCreateRoot = () => {
        openCreate(null);
    };

    const handleCreateChild = () => {
        if (!selectedRow?.menuId) {
            alert("하위 메뉴를 추가할 상위 메뉴를 왼쪽 트리에서 먼저 선택하세요.");
            return;
        }
        openCreate(selectedRow);
    };

    const handleEdit = () => {
        if (!selectedRow?.menuId) {
            alert("수정할 메뉴를 선택하세요.");
            return;
        }
        setModalMode("edit");
        setModalInitial(selectedRow);
        setModalOpen(true);
    };

    const openEdit = (row: MenuRow) => {
        setSelectedRow(row);
        setModalMode("edit");
        setModalInitial(row);
        setModalOpen(true);
    };

    const handleSoftDelete = async () => {
        if (!selectedRow?.menuId) {
            alert("미사용 처리할 메뉴를 선택하세요.");
            return;
        }
        if (
            !confirm(
                `「${selectedRow.menuName ?? selectedRow.menuCode}」을(를) 미사용 처리할까요?\n\nDB에서는 삭제되지 않고 USE_YN = 'N' 으로만 바뀝니다.`
            )
        ) {
            return;
        }

        try {
            await deleteMutation.mutateAsync(selectedRow.menuId);
            setSelectedRow((prev) => (prev?.menuId === selectedRow.menuId ? { ...prev, useYn: "N" } : prev));
        } catch (e) {
            alert(e instanceof Error ? e.message : "처리 중 오류");
        }
    };

    const handleRestore = async () => {
        if (!selectedRow?.menuId || selectedRow.useYn !== "N") {
            alert("복구할 미사용 메뉴를 선택하세요.");
            return;
        }
        try {
            await saveMutation.mutateAsync({
                row: { ...selectedRow, useYn: "Y" },
                mode: "edit",
            });
            setSelectedRow((prev) => (prev?.menuId === selectedRow.menuId ? { ...prev, useYn: "Y" } : prev));
        } catch (e) {
            alert(e instanceof Error ? e.message : "복구 중 오류");
        }
    };

    const handleSave = async (row: MenuRow) => {
        await saveMutation.mutateAsync({ row, mode: modalMode });
    };

    const handleMove = async ({
        dragIds,
        parentId,
        index,
    }: {
        dragIds: string[];
        parentId: string | null;
        index: number;
    }) => {
        if (busy || dragIds.length !== 1) return;
        if (dragSaveLockRef.current) return;
        dragSaveLockRef.current = true;

        try {
            const movingId = dragIds[0];
            const cloned = cloneMenuTree(treeData);

            function removeNode(nodes: MenuNode[], id: string): MenuNode | null {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].id === id) {
                        return nodes.splice(i, 1)[0];
                    }
                    const found = removeNode(nodes[i].children ?? [], id);
                    if (found) return found;
                }
                return null;
            }

            function findChildren(nodes: MenuNode[], id: string | null): MenuNode[] | null {
                if (id == null) return nodes;
                for (const node of nodes) {
                    if (node.id === id) {
                        node.children ??= [];
                        return node.children;
                    }
                    const found = findChildren(node.children ?? [], id);
                    if (found) return found;
                }
                return null;
            }

            const movingNode = removeNode(cloned, movingId);
            if (!movingNode) return;

            const targetChildren = findChildren(cloned, parentId);
            if (!targetChildren) return;

            targetChildren.splice(index, 0, movingNode);

            const nextFlat = flattenTree(cloned);
            const changed = diffMenus(flatMenus, nextFlat);

            if (changed.length === 0) return;

            const toSave = mergeStructureIntoOriginal(flatMenus, changed);
            if (toSave.length === 0) {
                await queryClient.refetchQueries({ queryKey: menuAdminKeys.tree });
                return;
            }

            await reorderMenus(
                toSave.map((r) => ({
                    menuId: r.menuId!,
                    parentMenuId: r.parentMenuId ?? null,
                    sortOrder: r.sortOrder ?? 0,
                }))
            );
            await queryClient.refetchQueries({ queryKey: menuAdminKeys.tree });
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : "메뉴 순서 저장 중 오류가 발생했습니다.");
        } finally {
            dragSaveLockRef.current = false;
        }
    };

    return (
        <div className={pageStyles.page}>
            <h2 className={pageStyles.title}>메뉴 관리</h2>
            <p
                style={{
                    margin: "0 0 18px",
                    color: "var(--text-subtle)",
                    fontSize: 14,
                    lineHeight: 1.6,
                }}
            >
                왼쪽 <strong>트리</strong>에서 메뉴를 선택합니다. <strong>더블클릭</strong>으로 수정,
                <strong> 드래그</strong>로 같은 레벨 순서 변경 또는 다른 노드 위/아래로 이동해 부모를 바꿀 수 있습니다.{" "}
                <strong>미사용 처리</strong>는 DB 행을 지우지 않고 <code>USE_YN = &apos;N&apos;</code> 으로만 바꿉니다.
                역할·사용자 메뉴에는 미사용 항목이 노출되지 않습니다.
            </p>

            <div className={pageStyles.toolbar}>
                <button
                    type="button"
                    onClick={() => menusQuery.refetch()}
                    disabled={busy}
                    title="서버에서 최신 트리 다시 불러오기"
                >
                    새로고침
                </button>
                <button type="button" onClick={handleCreateRoot} disabled={busy}>
                    루트 메뉴 등록
                </button>
                <button type="button" onClick={handleCreateChild} disabled={busy}>
                    하위 메뉴 등록
                </button>
                <button type="button" onClick={handleEdit} disabled={busy}>
                    수정
                </button>
                <button
                    type="button"
                    className={pageStyles.dangerButton}
                    onClick={handleSoftDelete}
                    disabled={busy || !selectedRow?.menuId}
                >
                    미사용 처리
                </button>
                <button
                    type="button"
                    onClick={handleRestore}
                    disabled={busy || selectedRow?.useYn !== "N"}
                    title="USE_YN 을 Y 로 복구"
                >
                    사용 복구
                </button>
            </div>

            <div className={pageStyles.pageInfo}>
                <span>
                    전체 {flatMenus.length}건 · 미사용 {flatMenus.filter((m) => m.useYn === "N").length}건
                </span>
            </div>

            <div className={pageStyles.sectionTitle}>메뉴 트리</div>

            <div className={styles.layout}>
                <div className={styles.treeWrap}>
                    <Tree<MenuNode>
                        data={treeData}
                        idAccessor="id"
                        childrenAccessor="children"
                        width="100%"
                        height={560}
                        indent={24}
                        rowHeight={36}
                        openByDefault={true}
                        onMove={handleMove}
                    >
                        {(props) => (
                            <ExplorerNode
                                {...props}
                                selectedId={selectedRow?.menuId}
                                onSelect={setSelectedRow}
                                onEdit={openEdit}
                            />
                        )}
                    </Tree>
                </div>

                <div className={styles.detailPanel}>
                    <h3 className={styles.detailTitle}>선택한 메뉴</h3>
                    {selectedRow?.menuId ? (
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>메뉴 ID</span>
                            <span>{selectedRow.menuId}</span>
                            <span className={styles.detailLabel}>메뉴 코드</span>
                            <span>{selectedRow.menuCode ?? "—"}</span>
                            <span className={styles.detailLabel}>메뉴명</span>
                            <span>{selectedRow.menuName ?? "—"}</span>
                            <span className={styles.detailLabel}>경로</span>
                            <span>{selectedRow.menuPath || "—"}</span>
                            <span className={styles.detailLabel}>상위 메뉴 ID</span>
                            <span>{selectedRow.parentMenuId ?? "— (루트)"}</span>
                            <span className={styles.detailLabel}>정렬</span>
                            <span>{selectedRow.sortOrder ?? 0}</span>
                            <span className={styles.detailLabel}>사용 여부</span>
                            <span>
                                {selectedRow.useYn === "N" ? (
                                    <>
                                        <strong style={{ color: "var(--danger, #dc2626)" }}>미사용 (N)</strong>
                                        <span className={styles.detailEmpty} style={{ marginLeft: 8 }}>
                                            「사용 복구」로 Y 로 되돌릴 수 있습니다.
                                        </span>
                                    </>
                                ) : (
                                    "사용 (Y)"
                                )}
                            </span>
                        </div>
                    ) : (
                        <div className={styles.detailEmpty}>왼쪽 트리에서 메뉴를 선택하세요.</div>
                    )}
                </div>
            </div>

            <MenuModal
                open={modalOpen}
                mode={modalMode}
                initial={modalInitial}
                allMenus={flatMenus}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
}
