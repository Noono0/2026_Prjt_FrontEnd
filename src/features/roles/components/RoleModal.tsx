"use client";

import { useEffect, useState } from "react";
import styles from "@/features/commonCodes/components/CodeModal.module.css";
import type { RoleRow } from "../api";

type Props = {
    open: boolean;
    mode: "create" | "edit";
    initial: RoleRow | null;
    onClose: () => void;
    onSave: (row: RoleRow) => Promise<void>;
};

const empty: RoleRow = {
    roleCode: "",
    roleName: "",
    useYn: "Y",
};

export default function RoleModal({ open, mode, initial, onClose, onSave }: Props) {
    const [form, setForm] = useState<RoleRow>(empty);

    useEffect(() => {
        if (!open) return;
        if (mode === "edit" && initial) {
            setForm({
                roleId: initial.roleId,
                roleCode: initial.roleCode ?? "",
                roleName: initial.roleName ?? "",
                useYn: initial.useYn ?? "Y",
            });
        } else {
            setForm(empty);
        }
    }, [open, mode, initial]);

    if (!open) return null;

    const handleSubmit = async () => {
        if (!form.roleCode?.trim()) {
            alert("권한 코드를 입력하세요.");
            return;
        }
        if (!form.roleName?.trim()) {
            alert("권한명을 입력하세요.");
            return;
        }
        try {
            await onSave({ ...form, roleCode: form.roleCode.trim(), roleName: form.roleName.trim() });
            onClose();
        } catch (e) {
            alert(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.modalTitle}>{mode === "create" ? "권한 등록" : "권한 수정"}</h3>
                    <button type="button" onClick={onClose} className={styles.closeButton}>
                        ✕
                    </button>
                </div>
                <div className={styles.body}>
                    <div>
                        <label className={styles.label}>권한 코드</label>
                        <input
                            className={styles.input}
                            value={form.roleCode ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, roleCode: e.target.value }))}
                            disabled={mode === "edit"}
                        />
                    </div>
                    <div>
                        <label className={styles.label}>권한명</label>
                        <input
                            className={styles.input}
                            value={form.roleName ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, roleName: e.target.value }))}
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
