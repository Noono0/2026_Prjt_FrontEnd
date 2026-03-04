"use client";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useUIStore } from "@/stores/uiStore";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: sidebarOpen ? "280px 1fr" : "72px 1fr" }}>
      <Sidebar />
      <div className="min-w-0">
        <TopBar />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
