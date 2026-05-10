/** DB/tag_list 쉼표 구문을 목록 표기용 `#AAA, #BBB` 형태로 포맷 */
export function formatBoardTagListForDisplay(tagList: string | undefined | null): string {
    if (tagList == null || !String(tagList).trim()) return "";
    return tagList
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t}`))
        .join(", ");
}
