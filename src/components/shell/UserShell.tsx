"use client";

import TopBar from "./TopBar";
import UserSidebar from "./UserSidebar";
import NoticeSitePopups from "@/components/notice/NoticeSitePopups";
import { useUIStore } from "@/stores/uiStore";
import shellStyles from "./AppShell.module.css";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import SiteFooter from "./SiteFooter";

export default function UserShell({ children }: { children: React.ReactNode }) {
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const toggleSidebar = useUIStore((s) => s.toggleSidebar);

    return (
        <div
            className={`${shellStyles.layout} ${
                sidebarOpen ? shellStyles.layoutExpanded : shellStyles.layoutCollapsed
            }`}
        >
            <button
                type="button"
                className={shellStyles.collapseToggle}
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
                title={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
            >
                {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>

            <UserSidebar />

            <div className={shellStyles.content}>
                <TopBar variant="site" />
                <main className={shellStyles.main}>
                    <NoticeSitePopups />
                    {children}
                </main>
                <SiteFooter />
            </div>
        </div>
    );
}
