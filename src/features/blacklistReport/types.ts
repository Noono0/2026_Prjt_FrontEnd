export type BlacklistReportListItem = {
    blacklistReportSeq?: number;
    blacklistTargetId?: string;
    title?: string;
    content?: string;
    writerMemberSeq?: number;
    writerMemberId?: string;
    writerProfileImageUrl?: string;
    writerName?: string;
    categoryCode?: string;
    categoryName?: string;
    viewCount?: number;
    likeCount?: number;
    dislikeCount?: number;
    commentCount?: number;
    reportCount?: number;
    commentAllowedYn?: string;
    replyAllowedYn?: string;
    createDt?: string;
    modifyDt?: string;
};

export type BlacklistReportSearchCondition = {
    keyword?: string;
    blacklistTargetId?: string;
    /** yyyy-MM-dd, 작성일 시작(포함) */
    createDtFrom?: string;
    /** yyyy-MM-dd, 작성일 끝(포함) */
    createDtTo?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    /** 공통코드 code_value (카테고리·추천수 탭) */
    categoryCode?: string;
};
