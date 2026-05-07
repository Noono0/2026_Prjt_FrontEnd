"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/uiStore";
import { useMenuStore } from "@/stores/menuStore";
import MenuTree from "./MenuTree";
import Link from "next/link";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
    const pathname = usePathname();
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const { defaultMenu, extraMenu } = useMenuStore();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <div className={styles.brand}>{sidebarOpen ? "ADMIN" : "A"}</div>
                {sidebarOpen && <span className={styles.subTitle}>4-depth 메뉴</span>}
            </div>

            <nav className={styles.nav}>
                <div className={styles.dashboardWrap}>
                    <Link
                        className={`${styles.dashboardLink} ${pathname === "/" ? styles.dashboardLinkActive : ""}`}
                        href="/"
                        title="Dashboard"
                    >
                        {sidebarOpen ? "대시보드" : "🏠"}
                    </Link>
                </div>

                {hydrated && <MenuTree nodes={defaultMenu} pathname={pathname ?? "/"} collapsed={!sidebarOpen} />}

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
