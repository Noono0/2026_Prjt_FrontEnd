"use client";

/**
 * TanStack Query 기본 옵션(staleTime, retry 등).
 * Providers에서 한 번만 생성해 QueryClientProvider에 넘깁니다.
 */
import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                gcTime: 5 * 60 * 1000,
                retry: 1,
                refetchOnWindowFocus: false,
            },
            mutations: {
                retry: 1,
            },
        },
    });
}
