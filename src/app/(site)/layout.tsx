import type { Metadata } from "next";
import UserShell from "@/components/shell/UserShell";

export const metadata: Metadata = { title: "PRJT" };

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    return <UserShell>{children}</UserShell>;
}
