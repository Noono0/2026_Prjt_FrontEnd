import type { Metadata } from "next";
import "./globals.css";
import "@/lib/ag-grid";
import Providers from "@/components/providers/Providers";
import AppShell from "@/components/shell/AppShell";

export const metadata: Metadata = { title: "Admin Console" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
