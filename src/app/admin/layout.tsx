import type { Metadata } from "next";
import AppShell from "@/components/shell/AppShell";

export const metadata: Metadata = { title: "Admin Console · PRJT" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AppShell>{children}</AppShell>;
}
