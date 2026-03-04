"use client";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/uiStore";
import { useMenuStore } from "@/stores/menuStore";
import MenuTree from "./MenuTree";
import Link from "next/link";

export default function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const { menu } = useMenuStore();

  return (
    <aside className="border-r h-screen sticky top-0 overflow-y-auto" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--card))" }}>
      <div className="h-14 px-4 flex items-center gap-2 border-b" style={{ borderColor: "rgb(var(--border))" }}>
        <div className="font-semibold">{sidebarOpen ? "ADMIN" : "A"}</div>
        {sidebarOpen && <span className="text-xs text-[rgb(var(--muted))]">4-depth 메뉴</span>}
      </div>

      <nav className="p-2">
        <div className="mb-2">
          <Link className={"block px-3 py-2 rounded-lg " + (pathname === "/" ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10")}
            href="/"
            title="Dashboard"
          >
            {sidebarOpen ? "대시보드" : "🏠"}
          </Link>
        </div>
        <MenuTree nodes={menu} pathname={pathname} collapsed={!sidebarOpen} />
      </nav>
    </aside>
  );
}
