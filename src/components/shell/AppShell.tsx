"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MenuBootstrap from "./MenuBootstrap";
import NoticeSitePopups from "@/components/notice/NoticeSitePopups";
import { useUIStore } from "@/stores/uiStore";
import styles from "./AppShell.module.css";

export default function AppShell({
                                     children,
                                 }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);

    // 새 창 전용 `/site-popup/[seq]` 만 셸 없이 렌더. `/site-popups`(관리)는 여기에 걸리면 안 됨.
    const isStandalonePopupWindow =
        pathname === "/site-popup" || (pathname?.startsWith("/site-popup/") ?? false);

    if (isStandalonePopupWindow) {
        return (
            <>
                {children}
            </>
        );
    }

    return (
        <div
            className={`${styles.layout} ${
                sidebarOpen ? styles.layoutExpanded : styles.layoutCollapsed
            }`}
        >
            <MenuBootstrap />
            <Sidebar />
            <div className={styles.content}>
                <TopBar />
                <main className={styles.main}>
                    <NoticeSitePopups />
                    {children}
                </main>
            </div>
        </div>
    );
}