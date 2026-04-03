export type BoardListItem = {
    boardSeq?: number;
    /** 공지사항을 자유게시판 상단에 고정 표시할 때 설정(상세는 /notice-board/{id}) */
    noticeBoardSeq?: number;
    categoryCode?: string;
    categoryName?: string;
    title?: string;
    content?: string;
    writerMemberSeq?: number;
    /** 회원 로그인 ID */
    writerMemberId?: string;
    writerName?: string;
    secretYn?: string;
    anonymousYn?: string;
    writerProfileImageUrl?: string;
    viewCount?: number;
    likeCount?: number;
    dislikeCount?: number;
    commentCount?: number;
    reportCount?: number;
    showYn?: string;
    highlightYn?: string;
    /** 자유게시판 목록 상단 고정 공지(백엔드 pin_on_free_board_yn) */
    pinOnFreeBoardYn?: string;
    /** Y/N, 생략 시 댓글 허용으로 간주 */
    commentAllowedYn?: string;
    /** Y/N, 생략 시 답글 허용으로 간주 */
    replyAllowedYn?: string;
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

export type BoardCategoryOption = {
    value: string;
    label: string;
};

/** GET /api/boards/popular-config — 대분류 그룹 A0001 · 중분류 code_id A00017 기반 */
export type BoardPopularConfig = {
    threshold: number;
    badgeLabel: string;
};

export type MemberEmoticon = {
    memberEmoticonSeq?: number;
    memberSeq?: number;
    imageUrl?: string;
    sortOrder?: number;
    createDt?: string;
};

export type BoardComment = {
    boardCommentSeq?: number;
    boardSeq?: number;
    parentBoardCommentSeq?: number | null;
    writerMemberSeq?: number;
    writerName?: string;
    writerMemberId?: string;
    writerProfileImageUrl?: string;
    content?: string;
    emoticonSeq1?: number;
    emoticonSeq2?: number;
    emoticonSeq3?: number;
    emoticonImageUrl1?: string;
    emoticonImageUrl2?: string;
    emoticonImageUrl3?: string;
    likeCount?: number;
    dislikeCount?: number;
    reportCount?: number;
    replyCount?: number;
    myVoteType?: string | null;
    createDt?: string;
    children?: BoardComment[];
};

