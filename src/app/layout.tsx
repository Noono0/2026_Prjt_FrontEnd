import type { Metadata } from "next";
import "./globals.css";
import "@/components/tiptap-node/video-embed-node/video-embed.scss";
import "@/lib/ag-grid";
import Providers from "@/components/providers/Providers";

export const metadata: Metadata = { title: "PRJT" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
