"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/uiStore";
import { userSidebarMenuTree } from "@/stores/menuStore";
import MenuTree from "./MenuTree";
import styles from "./Sidebar.module.css";
import sidebarFooter from "./UserSidebar.module.css";

export default function UserSidebar() {
    const pathname = usePathname();
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    const dashPath = pathname?.split("?")[0] ?? "/";
    const dashboardActive = dashPath === "/";

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <div className={`${styles.brand} ${sidebarFooter.siteBrand}`}>
                    {sidebarOpen ? "Welcome to Gamniverse" : "W"}
                </div>
            </div>

            <nav className={styles.nav}>
                <div className={styles.dashboardWrap}>
                    <Link
                        className={`${styles.dashboardLink} ${dashboardActive ? styles.dashboardLinkActive : ""}`}
                        href="/"
                        title="메인"
                    >
                        {sidebarOpen ? "🏠 메인" : "🏠"}
                    </Link>
                </div>

                {hydrated && (
                    <MenuTree nodes={userSidebarMenuTree} pathname={pathname ?? "/"} collapsed={!sidebarOpen} />
                )}

                {hydrated && sidebarOpen && (
                    <div className={sidebarFooter.footer}>
                        <Link href="/admin" className={sidebarFooter.footerLink}>
                            ⚙ 관리자 콘솔
                        </Link>
                    </div>
                )}
                {hydrated && !sidebarOpen && (
                    <div className={`${styles.dashboardWrap} ${sidebarFooter.collapsedFooter}`}>
                        <Link href="/admin" className={styles.dashboardLink} title="관리자">
                            ⚙
                        </Link>
                    </div>
                )}
            </nav>
        </aside>
    );
}
