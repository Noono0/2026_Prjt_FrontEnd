/**
 * 개발 모드(`pnpm dev`)에서만 콘솔 출력. 프로덕션 빌드에서는 대부분 제거됩니다.
 * F12 → Console에서 `[자유게시판]` 등 스코프 문자열로 필터하면 찾기 쉽습니다.
 */
export function devLog(scope: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === "development") {
        console.log(`[${scope}]`, ...args);
    }
}
