"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MenuBootstrap from "./MenuBootstrap";
import NoticeSitePopups from "@/components/notice/NoticeSitePopups";
import { useUIStore } from "@/stores/uiStore";
import styles from "./AppShell.module.css";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function AppShell({
                                     children,
                                 }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const toggleSidebar = useUIStore((s) => s.toggleSidebar);

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
            <button
                type="button"
                className={styles.collapseToggle}
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
                title={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
            >
                {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>

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