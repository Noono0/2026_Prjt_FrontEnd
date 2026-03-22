"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./MenuModal.module.css";
import type { MenuRow } from "../api";
import { filterSelectableParents } from "../arboristUtils";

type Props = {
    open: boolean;
    mode: "create" | "edit";
    initial: MenuRow | null;
    /** 상위 메뉴 선택용 전체 목록 */
    allMenus: MenuRow[];
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

export default function MenuModal({ open, mode, initial, allMenus, onClose, onSave }: Props) {
    const [form, setForm] = useState<MenuRow>(empty);

    const parentChoices = useMemo(() => {
        const base =
            mode === "edit" && initial?.menuId
                ? filterSelectableParents(allMenus, initial.menuId)
                : allMenus;
        return [...base].sort((a, b) => {
            const c = (a.menuCode ?? "").localeCompare(b.menuCode ?? "");
            if (c !== 0) return c;
            return (a.menuId ?? 0) - (b.menuId ?? 0);
        });
    }, [allMenus, mode, initial?.menuId]);

    useEffect(() => {
        if (!open) return;
        if (mode === "edit" && initial?.menuId) {
            setForm({
                menuId: initial.menuId,
                menuCode: initial.menuCode ?? "",
                menuName: initial.menuName ?? "",
                menuPath: initial.menuPath ?? "",
                parentMenuId: initial.parentMenuId,
                sortOrder: initial.sortOrder ?? 0,
                useYn: initial.useYn ?? "Y",
            });
        } else if (mode === "create") {
            setForm({
                ...empty,
                parentMenuId: initial?.parentMenuId,
                sortOrder: initial?.sortOrder ?? 0,
                useYn: "Y",
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
                useYn: form.useYn ?? "Y",
            });
            onClose();
        } catch (e) {
            alert(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.modalTitle}>
                        {mode === "create" ? "메뉴 등록" : "메뉴 수정"}
                    </h3>
                    <button type="button" onClick={onClose} className={styles.closeButton}>
                        ✕
                    </button>
                </div>
                <div className={styles.body}>
                    <div>
                        <label className={styles.label}>메뉴 코드</label>
                        <input
                            className={mode === "edit" ? styles.readonly : styles.input}
                            value={form.menuCode ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, menuCode: e.target.value }))}
                            disabled={mode === "edit"}
                            placeholder="예: MEMBER_SUB"
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
                    <div className={styles.full}>
                        <label className={styles.label}>상위 메뉴</label>
                        <select
                            className={styles.select}
                            value={form.parentMenuId != null ? String(form.parentMenuId) : ""}
                            onChange={(e) => {
                                const v = e.target.value;
                                setForm((p) => ({
                                    ...p,
                                    parentMenuId: v === "" ? undefined : Number(v),
                                }));
                            }}
                        >
                            <option value="">(루트)</option>
                            {parentChoices.map((m) => (
                                <option key={m.menuId} value={m.menuId}>
                                    {(m.menuName ?? "").trim()} ({m.menuCode})
                                    {m.useYn === "N" ? " · 미사용" : ""}
                                </option>
                            ))}
                        </select>
                        <p className={styles.hint}>
                            루트는 상위 없음. 하위 메뉴는 드래그로도 이동할 수 있습니다.
                        </p>
                    </div>
                    <div>
                        <label className={styles.label}>정렬 순서</label>
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
                        <label className={styles.label}>사용 여부</label>
                        <select
                            className={styles.select}
                            value={form.useYn ?? "Y"}
                            onChange={(e) => setForm((p) => ({ ...p, useYn: e.target.value }))}
                        >
                            <option value="Y">사용 (Y)</option>
                            <option value="N">미사용 (N)</option>
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
