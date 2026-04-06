/** 백엔드 `BlacklistReportExcelExporter` 의 허용 키(camelCase)와 동일해야 함 */

export type BlacklistExcelColumnOption = { key: string; label: string };

export const BLACKLIST_EXCEL_COLUMN_OPTIONS: BlacklistExcelColumnOption[] = [
    { key: "blacklistReportSeq", label: "번호" },
    { key: "blacklistTargetId", label: "블랙리스트 아이디" },
    { key: "title", label: "제목" },
    { key: "categoryName", label: "카테고리" },
    { key: "categoryCode", label: "카테고리 코드" },
    { key: "writerName", label: "작성자" },
    { key: "writerMemberId", label: "작성자 아이디" },
    { key: "writerMemberSeq", label: "작성자 회원번호" },
    { key: "writerProfileImageUrl", label: "작성자 프로필 URL" },
    { key: "viewCount", label: "조회" },
    { key: "likeCount", label: "추천" },
    { key: "dislikeCount", label: "비추천" },
    { key: "commentCount", label: "댓글 수" },
    { key: "reportCount", label: "신고 수" },
    { key: "commentAllowedYn", label: "댓글 허용" },
    { key: "replyAllowedYn", label: "답글 허용" },
    { key: "createDt", label: "작성일시" },
    { key: "modifyDt", label: "수정일시" },
    { key: "content", label: "내용(텍스트)" },
];

export const DEFAULT_BLACKLIST_EXCEL_KEYS = [
    "blacklistReportSeq",
    "blacklistTargetId",
    "title",
    "writerName",
    "viewCount",
    "createDt",
    "content",
];

export const EXCEL_COLUMNS_STORAGE_KEY = "blacklist-report-excel-columns-v1";

const ALLOWED = new Set(BLACKLIST_EXCEL_COLUMN_OPTIONS.map((o) => o.key));

export function normalizeExcelColumnKeys(raw: string[] | null | undefined): string[] {
    if (!raw?.length) return [...DEFAULT_BLACKLIST_EXCEL_KEYS];
    const out: string[] = [];
    for (const k of BLACKLIST_EXCEL_COLUMN_OPTIONS) {
        if (raw.includes(k.key) && ALLOWED.has(k.key)) {
            out.push(k.key);
        }
    }
    return out.length ? out : [...DEFAULT_BLACKLIST_EXCEL_KEYS];
}

export function loadStoredExcelColumnKeys(): string[] {
    if (typeof window === "undefined") return [...DEFAULT_BLACKLIST_EXCEL_KEYS];
    try {
        const s = localStorage.getItem(EXCEL_COLUMNS_STORAGE_KEY);
        if (!s) return [...DEFAULT_BLACKLIST_EXCEL_KEYS];
        const parsed = JSON.parse(s) as unknown;
        if (!Array.isArray(parsed)) return [...DEFAULT_BLACKLIST_EXCEL_KEYS];
        return normalizeExcelColumnKeys(parsed as string[]);
    } catch {
        return [...DEFAULT_BLACKLIST_EXCEL_KEYS];
    }
}

export function saveStoredExcelColumnKeys(keys: string[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(EXCEL_COLUMNS_STORAGE_KEY, JSON.stringify(normalizeExcelColumnKeys(keys)));
}
