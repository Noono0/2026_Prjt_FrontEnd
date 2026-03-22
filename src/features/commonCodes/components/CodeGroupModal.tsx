"use client";

import { useEffect, useState } from "react";
import styles from "./CodeModal.module.css";
import {
  useDeleteCodeGroupMutation,
  useSaveCodeGroupMutation,
} from "../queries";
import type { CodeGroupRow } from "../api";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  selectedGroup: CodeGroupRow | null;
  onClose: () => void;
};

const emptyForm: CodeGroupRow = {
  codeGroupId: "",
  codeGroupName: "",
  description: "",
  sortOrder: 0,
  useYn: "Y",
  delYn: "N",
};

export default function CodeGroupModal({
                                         open,
                                         mode,
                                         selectedGroup,
                                         onClose,
                                       }: Props) {
  const [form, setForm] = useState<CodeGroupRow>(emptyForm);

  const saveMutation = useSaveCodeGroupMutation();
  const deleteMutation = useDeleteCodeGroupMutation();

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && selectedGroup) {
      setForm({
        codeGroupSeq: selectedGroup.codeGroupSeq,
        codeGroupId: selectedGroup.codeGroupId ?? "",
        codeGroupName: selectedGroup.codeGroupName ?? "",
        description: selectedGroup.description ?? "",
        sortOrder: selectedGroup.sortOrder ?? 0,
        useYn: selectedGroup.useYn ?? "Y",
        delYn: selectedGroup.delYn ?? "N",
      });
      return;
    }

    setForm(emptyForm);
  }, [open, mode, selectedGroup]);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.codeGroupId?.trim()) {
      alert("코드그룹 ID를 입력하세요.");
      return;
    }
    if (!form.codeGroupName?.trim()) {
      alert("코드그룹명을 입력하세요.");
      return;
    }

    try {
      await saveMutation.mutateAsync({ row: form, mode });
      alert(mode === "create" ? "대분류 등록 완료" : "대분류 수정 완료");
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!form.codeGroupSeq) return;
    if (!confirm("선택한 대분류를 삭제할까요?")) return;

    try {
      await deleteMutation.mutateAsync(form.codeGroupSeq);
      alert("대분류 삭제 완료");
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.");
    }
  };

  return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h3 className={styles.modalTitle}>
              {mode === "create" ? "대분류 등록" : "대분류 수정"}
            </h3>
            <button onClick={onClose} className={styles.closeButton} type="button">
              ✕
            </button>
          </div>

          <div className={styles.body}>
            <div>
              <label className={styles.label}>코드그룹 ID</label>
              <input
                  className={styles.input}
                  value={form.codeGroupId ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, codeGroupId: e.target.value }))}
                  disabled={mode === "edit"}
              />
            </div>

            <div>
              <label className={styles.label}>코드그룹명</label>
              <input
                  className={styles.input}
                  value={form.codeGroupName ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, codeGroupName: e.target.value }))}
              />
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
          </div>

          <div className={styles.footer}>
            {mode === "edit" && (
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