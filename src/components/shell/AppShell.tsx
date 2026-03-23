"use client";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MenuBootstrap from "./MenuBootstrap";
import { useUIStore } from "@/stores/uiStore";
import styles from "./AppShell.module.css";

export default function AppShell({
                                     children,
                                 }: {
    children: React.ReactNode;
}) {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);

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
                <main className={styles.main}>{children}</main>
            </div>
        </div>
    );
}