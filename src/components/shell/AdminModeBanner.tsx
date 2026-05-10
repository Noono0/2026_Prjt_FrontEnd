"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

/**
 * 관리자 셸 상단 고정 바 — 사용자 화면과 시각적으로 구분
 */
export default function AdminModeBanner() {
    return (
        <header
            className="fixed left-0 right-0 top-0 z-[100] flex h-10 shrink-0 items-center justify-between gap-3 border-b border-indigo-500/35 bg-gradient-to-r from-indigo-950 via-[#1e1b4b] to-indigo-950 px-4 text-indigo-50 shadow-[0_4px_24px_rgba(49,46,129,0.35)]"
            role="banner"
            aria-label="관리자 모드 안내"
        >
            <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex shrink-0 items-center justify-center rounded-md border border-indigo-400/30 bg-indigo-500/20 p-1 text-indigo-200">
                    <Shield size={16} strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0 leading-tight">
                    <span className="font-semibold tracking-tight text-white">관리자 모드</span>
                    <span className="mx-2 hidden text-indigo-300/70 sm:inline">|</span>
                    <span className="hidden text-xs text-indigo-200/90 sm:inline">
                        회원·콘텐츠·설정 변경은 관리 화면에서만 수행 중입니다.
                    </span>
                </div>
            </div>
            <Link
                href="/"
                className="shrink-0 rounded-md border border-indigo-400/25 bg-white/5 px-2.5 py-1 text-xs font-medium text-indigo-100 transition hover:bg-white/10 hover:text-white"
            >
                사이트로 이동
            </Link>
        </header>
    );
}
