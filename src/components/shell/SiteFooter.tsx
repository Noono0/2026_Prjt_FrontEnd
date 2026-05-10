"use client";

import Link from "next/link";
import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
    return (
        <footer className={styles.footer}>
            <div className={styles.copyright}>© 2026 gamcompany.kr. All rights reserved.</div>
            <div className={styles.linksRow}>
                <span className={`${styles.item} ${styles.emailText}`}>관리자 이메일: zzatomi90@gmail.com</span>
                <Link href="/terms" className={styles.item}>
                    서비스 이용약관
                </Link>
                <Link href="/privacy-policy" className={styles.item}>
                    개인정보 처리방침
                </Link>
                <Link href="/youth-policy" className={styles.item}>
                    청소년보호정책
                </Link>
            </div>
        </footer>
    );
}
