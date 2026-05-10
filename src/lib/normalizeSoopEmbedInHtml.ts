/**
 * 예전 본문에 남아 있는 SOOP `/player/{id}/catch`(풀 페이지) iframe src를
 * `/player/{id}/embed` 로 바꿔 표시합니다. 표시 전용 변환이며 DB는 그대로일 수 있습니다.
 */
export function normalizeSoopEmbedInHtml(html: string): string {
    if (!html || !html.includes("vod.sooplive")) {
        return html;
    }
    return html.replace(/(https:\/\/vod\.sooplive\.(?:com|co\.kr)\/player\/\d+)\/catch\/?(?=["\s>]|$)/gi, "$1/embed");
}

/**
 * 자유게시판 외 본문에서는 영상 임베드(에디터 블록·iframe)를 제거합니다.
 */
export function stripVideoEmbedsFromHtml(html: string): string {
    if (!html) return html;
    let out = html;

    if (out.includes("board-video-embed")) {
        out = out.replace(/<div[^>]*\bboard-video-embed\b[^>]*>[\s\S]*?<\/div>/gi, "");
    }

    if (/<iframe\b/i.test(out)) {
        out = out.replace(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>/gi, (full, src) => {
            const s = String(src).toLowerCase();
            if (
                s.includes("youtube.com/") ||
                s.includes("youtube-nocookie.com/") ||
                s.includes("youtu.be") ||
                s.includes("vod.sooplive.") ||
                s.includes("sooplive.")
            ) {
                return "";
            }
            return full;
        });
    }

    return out;
}
