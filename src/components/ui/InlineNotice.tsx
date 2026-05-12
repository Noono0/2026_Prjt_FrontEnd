import type { ReactNode } from "react";

type Props = {
    children: ReactNode;
    className?: string;
};

/** 조회·로드 실패 등 — 브라우저 alert 대신 페이지 내 경고 문구 */
export function InlineNotice({ children, className = "" }: Props) {
    return (
        <div
            role="alert"
            className={`rounded-lg border border-amber-600/45 bg-amber-950/35 px-3 py-2.5 text-sm leading-snug text-amber-100 ${className}`}
        >
            {children}
        </div>
    );
}
