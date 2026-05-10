"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/uiStore";
import { adminDefaultMenu, useMenuStore } from "@/stores/menuStore";
import MenuTree from "./MenuTree";
import Link from "next/link";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
    const pathname = usePathname();
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const extraMenu = useMenuStore((s) => s.extraMenu);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    const dashboardActive = pathname === "/admin";

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <div className={styles.brand}>{sidebarOpen ? "ADMIN" : "A"}</div>
                {sidebarOpen && <span className={styles.subTitle}>4-depth 메뉴</span>}
            </div>

            <nav className={styles.nav}>
                <div className={styles.dashboardWrap}>
                    <Link
                        className={`${styles.dashboardLink} ${dashboardActive ? styles.dashboardLinkActive : ""}`}
                        href="/admin"
                        title="메인"
                    >
                        {sidebarOpen ? "🏠 메인" : "🏠"}
                    </Link>
                </div>

                {hydrated && <MenuTree nodes={adminDefaultMenu} pathname={pathname ?? "/"} collapsed={!sidebarOpen} />}

                {hydrated && extraMenu.length > 0 && (
                    <div className={styles.extraSection}>
                        {sidebarOpen && <div className={styles.extraTitle}>추가 메뉴</div>}
                        <MenuTree nodes={extraMenu} pathname={pathname ?? "/"} collapsed={!sidebarOpen} />
                    </div>
                )}
            </nav>
        </aside>
    );
}
