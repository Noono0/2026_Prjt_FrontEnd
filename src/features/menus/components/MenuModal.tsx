"use client";

import { useEffect, useState } from "react";
import styles from "@/features/commonCodes/components/CodeModal.module.css";
import type { MenuRow } from "../api";

type Props = {
    open: boolean;
    mode: "create" | "edit";
    initial: MenuRow | null;
    onClose: () => void;
    onSave: (row: MenuRow) => Promise<void>;
};

const empty: MenuRow = {
    menuCode: "",
    menuName: "",
    menuPath: "",
    sortOrder: 0,
    useYn: "Y",
};

export default function MenuModal({ open, mode, initial, onClose, onSave }: Props) {
    const [form, setForm] = useState<MenuRow>(empty);

    useEffect(() => {
        if (!open) return;
        if (mode === "edit" && initial) {
            setForm({
                menuId: initial.menuId,
                menuCode: initial.menuCode ?? "",
                menuName: initial.menuName ?? "",
                menuPath: initial.menuPath ?? "",
                parentMenuId: initial.parentMenuId,
                sortOrder: initial.sortOrder ?? 0,
                useYn: initial.useYn ?? "Y",
            });
        } else {
            setForm(empty);
        }
    }, [open, mode, initial]);

    if (!open) return null;

    const handleSubmit = async () => {
        if (!form.menuCode?.trim()) {
            alert("메뉴 코드를 입력하세요.");
            return;
        }
        if (!form.menuName?.trim()) {
            alert("메뉴명을 입력하세요.");
            return;
        }
        try {
            await onSave({
                ...form,
                menuCode: form.menuCode.trim(),
                menuName: form.menuName.trim(),
                menuPath: (form.menuPath ?? "").trim(),
                sortOrder: Number(form.sortOrder ?? 0),
            });
            onClose();
        } catch (e) {
            alert(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modalLarge}>
                <div className={styles.header}>
                    <h3 className={styles.modalTitle}>{mode === "create" ? "메뉴 등록" : "메뉴 수정"}</h3>
                    <button type="button" onClick={onClose} className={styles.closeButton}>
                        ✕
                    </button>
                </div>
                <div className={styles.body}>
                    <div>
                        <label className={styles.label}>메뉴 코드</label>
                        <input
                            className={styles.input}
                            value={form.menuCode ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, menuCode: e.target.value }))}
                            disabled={mode === "edit"}
                        />
                    </div>
                    <div>
                        <label className={styles.label}>메뉴명</label>
                        <input
                            className={styles.input}
                            value={form.menuName ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, menuName: e.target.value }))}
                        />
                    </div>
                    <div className={styles.full}>
                        <label className={styles.label}>경로 (예: /members)</label>
                        <input
                            className={styles.input}
                            value={form.menuPath ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, menuPath: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className={styles.label}>상위 메뉴 ID</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={form.parentMenuId ?? ""}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    parentMenuId: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                }))
                            }
                            placeholder="없으면 비움"
                        />
                    </div>
                    <div>
                        <label className={styles.label}>정렬</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={form.sortOrder ?? 0}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, sortOrder: Number(e.target.value || 0) }))
                            }
                        />
                    </div>
                    <div>
                        <label className={styles.label}>사용여부</label>
                        <select
                            className={styles.input}
                            value={form.useYn ?? "Y"}
                            onChange={(e) => setForm((p) => ({ ...p, useYn: e.target.value }))}
                        >
                            <option value="Y">Y</option>
                            <option value="N">N</option>
                        </select>
                    </div>
                </div>
                <div className={styles.footer}>
                    <button type="button" className={styles.secondaryButton} onClick={onClose}>
                        닫기
                    </button>
                    <button type="button" className={styles.primaryButton} onClick={handleSubmit}>
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
