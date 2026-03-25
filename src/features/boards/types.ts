export type BoardListItem = {
    boardSeq?: number;
    categoryCode?: string;
    categoryName?: string;
    title?: string;
    content?: string;
    writerMemberSeq?: number;
    writerName?: string;
    viewCount?: number;
    likeCount?: number;
    dislikeCount?: number;
    commentCount?: number;
    reportCount?: number;
    showYn?: string;
    highlightYn?: string;
    createDt?: string;
    modifyDt?: string;
};

export type BoardSearchCondition = {
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

