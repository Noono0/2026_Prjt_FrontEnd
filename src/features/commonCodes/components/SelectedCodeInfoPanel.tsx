"use client";

import type { CodeDetailRow, CodeGroupRow } from "../api";
import styles from "./SelectedCodeInfoPanel.module.css";

type Props = {
    selectedGroup: CodeGroupRow | null;
    selectedMiddle: CodeDetailRow | null;
    selectedSmall: CodeDetailRow | null;
};

function Row({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className={styles.row}>
            <div className={styles.label}>{label}</div>
            <div className={styles.value}>{value === undefined || value === null || value === "" ? "-" : value}</div>
        </div>
    );
}

export default function SelectedCodeInfoPanel({
    selectedGroup,
    selectedMiddle,
    selectedSmall,
}: Props) {
    const target = selectedSmall ?? selectedMiddle ?? selectedGroup;
    const levelText = selectedSmall ? "소분류" : selectedMiddle ? "중분류" : selectedGroup ? "대분류" : "-";

    return (
        <section className={styles.panel}>
            <div className={styles.header}>
                <h4 className={styles.title}>선택 항목 정보</h4>
                <span className={styles.badge}>{levelText}</span>
            </div>

            <div className={styles.grid}>
                <Row label="대분류 ID" value={selectedGroup?.codeGroupId} />
                <Row label="대분류명" value={selectedGroup?.codeGroupName} />
                <Row label="중분류 코드ID" value={selectedMiddle?.codeId} />
                <Row label="중분류 코드명" value={selectedMiddle?.codeName} />
                <Row label="소분류 코드ID" value={selectedSmall?.codeId} />
                <Row label="소분류 코드명" value={selectedSmall?.codeName} />
                <Row label="선택 코드값" value={(target as CodeDetailRow | null)?.codeValue} />
                <Row label="설명" value={(target as CodeDetailRow | CodeGroupRow | null)?.description} />
            </div>
        </section>
    );
}
