"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./CodeModal.module.css";
import {
    useDeleteCodeDetailMutation,
    useSaveCodeDetailMutation,
} from "../queries";
import type { CodeDetailRow, CodeGroupRow } from "../api";

type Mode = "create-middle" | "edit-middle" | "create-small" | "edit-small";

type Props = {
    open: boolean;
    mode: Mode;
    selectedGroup: CodeGroupRow | null;
    selectedMiddle: CodeDetailRow | null;
    selectedSmall: CodeDetailRow | null;
    onClose: () => void;
};

const emptyForm: CodeDetailRow = {
    codeGroupSeq: undefined,
    parentDetailSeq: undefined,
    codeId: "",
    codeValue: "",
    codeName: "",
    codeLevel: 2,
    description: "",
    sortOrder: 0,
    useYn: "Y",
    delYn: "N",
    attr1: "",
    attr2: "",
    attr3: "",
};

export default function CodeDetailModal({
                                            open,
                                            mode,
                                            selectedGroup,
                                            selectedMiddle,
                                            selectedSmall,
                                            onClose,
                                        }: Props) {
    const [form, setForm] = useState<CodeDetailRow>(emptyForm);

    const isEdit = mode === "edit-middle" || mode === "edit-small";
    const saveMode = isEdit ? "edit" : "create";
    const saveMutation = useSaveCodeDetailMutation();
    const deleteMutation = useDeleteCodeDetailMutation();

    const currentTarget = useMemo(() => {
        if (mode === "edit-middle") return selectedMiddle;
        if (mode === "edit-small") return selectedSmall;
        return null;
    }, [mode, selectedMiddle, selectedSmall]);

    useEffect(() => {
        if (!open) return;

        if (mode === "create-middle") {
            setForm({
                ...emptyForm,
                codeGroupSeq: selectedGroup?.codeGroupSeq,
                codeLevel: 2,
            });
            return;
        }

        if (mode === "create-small") {
            setForm({
                ...emptyForm,
                codeGroupSeq: selectedGroup?.codeGroupSeq,
                parentDetailSeq: selectedMiddle?.codeDetailSeq,
                codeLevel: 3,
            });
            return;
        }

        if (currentTarget) {
            setForm({
                codeDetailSeq: currentTarget.codeDetailSeq,
                codeGroupSeq: currentTarget.codeGroupSeq,
                parentDetailSeq: currentTarget.parentDetailSeq,
                codeId: currentTarget.codeId ?? "",
                codeValue: currentTarget.codeValue ?? "",
                codeName: currentTarget.codeName ?? "",
                codeLevel: currentTarget.codeLevel ?? 2,
                description: currentTarget.description ?? "",
                sortOrder: currentTarget.sortOrder ?? 0,
                useYn: currentTarget.useYn ?? "Y",
                delYn: currentTarget.delYn ?? "N",
                attr1: currentTarget.attr1 ?? "",
                attr2: currentTarget.attr2 ?? "",
                attr3: currentTarget.attr3 ?? "",
            });
        }
    }, [open, mode, selectedGroup?.codeGroupSeq, selectedMiddle?.codeDetailSeq, currentTarget]);

    if (!open) return null;

    const title =
        mode === "create-middle"
            ? "중분류 등록"
            : mode === "edit-middle"
                ? "중분류 수정"
                : mode === "create-small"
                    ? "소분류 등록"
                    : "소분류 수정";

    const handleSave = async () => {
        if (!form.codeGroupSeq) {
            alert("대분류를 먼저 선택하세요.");
            return;
        }
        if (!form.codeId?.trim()) {
            alert("코드 ID를 입력하세요.");
            return;
        }
        if (!form.codeName?.trim()) {
            alert("코드명을 입력하세요.");
            return;
        }
        if (form.codeLevel === 3 && !form.parentDetailSeq) {
            alert("소분류는 상위 중분류가 필요합니다.");
            return;
        }

        try {
            await saveMutation.mutateAsync({ row: form, mode: saveMode });
            alert(isEdit ? "코드 수정 완료" : "코드 등록 완료");
            onClose();
        } catch (error) {
            alert(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async () => {
        if (!form.codeDetailSeq) return;
        if (!confirm("선택한 코드를 삭제할까요?")) return;

        try {
            await deleteMutation.mutateAsync(form.codeDetailSeq);
            alert("코드 삭제 완료");
            onClose();
        } catch (error) {
            alert(error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modalLarge}>
                <div className={styles.header}>
                    <h3 className={styles.modalTitle}>{title}</h3>
                    <button onClick={onClose} className={styles.closeButton} type="button">
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    <div>
                        <label className={styles.label}>코드레벨</label>
                        <input value={String(form.codeLevel ?? 2)} readOnly className={styles.readonly} />
                    </div>

                    <div>
                        <label className={styles.label}>상위 대분류</label>
                        <input
                            value={selectedGroup?.codeGroupName ?? ""}
                            readOnly
                            className={styles.readonly}
                        />
                    </div>

                    <div>
                        <label className={styles.label}>상위 중분류</label>
                        <input
                            value={form.codeLevel === 3 ? selectedMiddle?.codeName ?? "" : ""}
                            readOnly
                            className={styles.readonly}
                        />
                    </div>

                    <div>
                        <label className={styles.label}>코드 ID</label>
                        <input
                            className={styles.input}
                            value={form.codeId ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, codeId: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className={styles.label}>코드명</label>
                        <input
                            className={styles.input}
                            value={form.codeName ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, codeName: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className={styles.label}>화면에 보여질 코드값</label>
                        <input
                            className={styles.input}
                            value={form.codeValue ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, codeValue: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className={styles.label}>정렬순서</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={form.sortOrder ?? 0}
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value || 0) }))
                            }
                        />
                    </div>

                    <div>
                        <label className={styles.label}>사용여부</label>
                        <select
                            className={styles.input}
                            value={form.useYn ?? "Y"}
                            onChange={(e) => setForm((prev) => ({ ...prev, useYn: e.target.value }))}
                        >
                            <option value="Y">사용</option>
                            <option value="N">미사용</option>
                        </select>
                    </div>

                    <div className={styles.full}>
                        <label className={styles.label}>설명</label>
                        <textarea
                            className={styles.textarea}
                            value={form.description ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className={styles.label}>ATTR1</label>
                        <input
                            className={styles.input}
                            value={form.attr1 ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, attr1: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className={styles.label}>ATTR2</label>
                        <input
                            className={styles.input}
                            value={form.attr2 ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, attr2: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className={styles.label}>ATTR3</label>
                        <input
                            className={styles.input}
                            value={form.attr3 ?? ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, attr3: e.target.value }))}
                        />
                    </div>
                </div>

                <div className={styles.footer}>
                    {isEdit && (
                        <button
                            type="button"
                            className={styles.dangerButton}
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            삭제
                        </button>
                    )}
                    <button type="button" className={styles.secondaryButton} onClick={onClose}>
                        닫기
                    </button>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}