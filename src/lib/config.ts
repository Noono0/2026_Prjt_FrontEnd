import { normalizeApiBaseUrl } from "@/lib/normalizeApiBaseUrl";

/** 서버(API Route)에서 스프링으로 프록시할 때 사용. Vercel에는 `API_BASE_URL` 또는 `NEXT_PUBLIC_API_BASE_URL` 필수(비우면 localhost로 붙어 실패) */
export const API_BASE_URL = normalizeApiBaseUrl(
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
);
