"use client";

import "@/lib/ag-grid";
import React from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => createQueryClient());

    return (
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}