export type NoticeBoardListItem = {
    noticeBoardSeq?: number;
    categoryCode?: string;
    categoryName?: string;
    title?: string;
    content?: string;
    writerMemberSeq?: number;
    writerName?: string;
    writerProfileImageUrl?: string;
    viewCount?: number;
    likeCount?: number;
    dislikeCount?: number;
    commentCount?: number;
    reportCount?: number;
    showYn?: string;
    highlightYn?: string;
    commentAllowedYn?: string;
    replyAllowedYn?: string;
    /** Y면 자유게시판 목록 상단에 고정 */
    pinOnFreeBoardYn?: string;
    createDt?: string;
    modifyDt?: string;
};

export type NoticeBoardSearchCondition = {
    categoryCode?: string;
    title?: string;
    writerName?: string;
    keyword?: string;
    showYn?: string;
    highlightYn?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

export type NoticeBoardCategoryOption = {
    value: string;
    label: string;
};
