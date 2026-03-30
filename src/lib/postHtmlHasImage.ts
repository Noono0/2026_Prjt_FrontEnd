/** 에디터 HTML 본문에 이미지 포함 여부 (목록 첨부 아이콘용) */
export function postHtmlContainsImage(html?: string | null): boolean {
    if (!html || typeof html !== "string") return false;
    const s = html.trim();
    if (!s) return false;
    const lower = s.toLowerCase();
    if (/<img[\s>/]/.test(lower)) return true;
    if (/\ssrc\s*=\s*["']data:image\//i.test(s)) return true;
    return false;
}
