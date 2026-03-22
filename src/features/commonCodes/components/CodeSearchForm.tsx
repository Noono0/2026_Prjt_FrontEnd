"use client";

import { useState } from "react";
import styles from "./CodeSearchForm.module.css";
import type { CodeGroupSearchCondition } from "../api";

type Props = {
    condition: CodeGroupSearchCondition;
    onSearch: (condition: Partial<CodeGroupSearchCondition>) => void;
    onReset: () => void;
    /** 대분류 목록 조회 중 버튼 중복 클릭 방지 */
    isBusy?: boolean;
};

export default function CodeSearchForm({ condition, onSearch, onReset, isBusy }: Props) {
    const [codeGroupId, setCodeGroupId] = useState(condition.codeGroupId ?? "");
    const [codeGroupName, setCodeGroupName] = useState(condition.codeGroupName ?? "");
    const [useYn, setUseYn] = useState(condition.useYn ?? "");

    const handleSearchClick = () => {
        const payload = {
            codeGroupId: codeGroupId.trim(),
            codeGroupName: codeGroupName.trim(),
            useYn,
        };

        console.log("[CodeSearchForm] 조회 버튼 클릭");
        console.log("[CodeSearchForm] 조회 payload =", payload);
        debugger;

        onSearch(payload);
    };

    const handleResetClick = () => {
        console.log("[CodeSearchForm] 초기화 버튼 클릭");
        debugger;

        setCodeGroupId("");
        setCodeGroupName("");
        setUseYn("");
        onReset();
    };

    return (
        <div className={styles.searchWrap}>
            <div className={styles.row}>
                <div className={styles.field}>
                    <label className={styles.label}>공통코드 ID</label>
                    <input
                        className={styles.input}
                        value={codeGroupId}
                        onChange={(e) => {
                            console.log("[CodeSearchForm] codeGroupId 변경 =", e.target.value);
                            setCodeGroupId(e.target.value);
                        }}
                        placeholder="공통코드 ID"
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>공통코드명</label>
                    <input
                        className={styles.input}
                        value={codeGroupName}
                        onChange={(e) => {
                            console.log("[CodeSearchForm] codeGroupName 변경 =", e.target.value);
                            setCodeGroupName(e.target.value);
                        }}
                        placeholder="공통코드명"
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>사용여부</label>
                    <select
                        className={styles.select}
                        value={useYn}
                        onChange={(e) => {
                            console.log("[CodeSearchForm] useYn 변경 =", e.target.value);
                            setUseYn(e.target.value);
                        }}
                    >
                        <option value="">전체</option>
                        <option value="Y">사용</option>
                        <option value="N">미사용</option>
                    </select>
                </div>
            </div>

            <div className={styles.buttonRow}>
                <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleSearchClick}
                    disabled={isBusy}
                >
                    공통코드 조회
                </button>

                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleResetClick}
                    disabled={isBusy}
                >
                    초기화
                </button>
            </div>
        </div>
    );
}