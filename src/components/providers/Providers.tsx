"use client";

/**
 * 앱 루트 래퍼. 여기서 TanStack Query(`@tanstack/react-query`)를 전역 제공합니다.
 * - QueryClientProvider: useQuery / useMutation 사용 가능
 * - 개발 시 ReactQueryDevtools(플로팅 패널) 표시
 * 전체 사용처 요약: `src/lib/STATE-LIBS.md`
 */
import "@/lib/ag-grid";
import React from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "@/lib/query-client";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => createQueryClient());

    return (
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                <QueryClientProvider client={queryClient}>
                    {children}

                    {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
                </QueryClientProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
