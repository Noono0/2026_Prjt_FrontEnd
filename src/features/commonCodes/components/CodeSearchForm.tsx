"use client";

import { useEffect, useState } from "react";
import styles from "./CodeSearchForm.module.css";
import type { CodeGroupSearchCondition } from "../api";

type Props = {
    condition: CodeGroupSearchCondition;
    onSearch: (condition: Partial<CodeGroupSearchCondition>) => void;
    onReset: () => void;
};

export default function CodeSearchForm({ condition, onSearch, onReset }: Props) {
    const [form, setForm] = useState({
        codeGroupId: condition.codeGroupId ?? "",
        codeGroupName: condition.codeGroupName ?? "",
        useYn: condition.useYn ?? "",
    });

    useEffect(() => {
        setForm({
            codeGroupId: condition.codeGroupId ?? "",
            codeGroupName: condition.codeGroupName ?? "",
            useYn: condition.useYn ?? "",
        });
    }, [condition.codeGroupId, condition.codeGroupName, condition.useYn]);

    return (
        <section className={styles.section}>
            <div className={styles.title}>검색조건</div>

            <div className={styles.grid}>
                <div>
                    <label className={styles.label}>코드그룹 ID</label>
                    <input
                        className={styles.input}
                        value={form.codeGroupId}
                        onChange={(e) => setForm((prev) => ({ ...prev, codeGroupId: e.target.value }))}
                    />
                </div>

                <div>
                    <label className={styles.label}>코드그룹명</label>
                    <input
                        className={styles.input}
                        value={form.codeGroupName}
                        onChange={(e) => setForm((prev) => ({ ...prev, codeGroupName: e.target.value }))}
                    />
                </div>

                <div>
                    <label className={styles.label}>사용여부</label>
                    <select
                        className={styles.input}
                        value={form.useYn}
                        onChange={(e) => setForm((prev) => ({ ...prev, useYn: e.target.value }))}
                    >
                        <option value="">전체</option>
                        <option value="Y">사용</option>
                        <option value="N">미사용</option>
                    </select>
                </div>

                <div className={styles.buttonWrap}>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() =>
                            onSearch({
                                codeGroupId: form.codeGroupId,
                                codeGroupName: form.codeGroupName,
                                useYn: form.useYn,
                            })
                        }
                    >
                        조회
                    </button>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                            setForm({ codeGroupId: "", codeGroupName: "", useYn: "" });
                            onReset();
                        }}
                    >
                        초기화
                    </button>
                </div>
            </div>
        </section>
    );
}