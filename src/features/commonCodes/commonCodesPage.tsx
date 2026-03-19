"use client";

import styles from "./CommonCodesPage.module.css";
import CodeSearchForm from "/components/CodeSearchForm";
import CodeGroupGrid from "./components/CodeGroupGrid";
import CodeDetailGrid from "./components/CodeDetailGrid";
import CodeEditForm from "./components/CodeEditForm";

export default function CommonCodesPage() {
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>공통코드 관리</h1>
            </div>

            <CodeSearchForm />

            <section className={styles.section}>
                <CodeGroupGrid />
            </section>

            <section className={styles.gridRow}>
                <CodeDetailGrid title="중분류" />
                <CodeDetailGrid title="소분류" />
            </section>

            <section className={styles.section}>
                <CodeEditForm />
            </section>
        </div>
    );
}