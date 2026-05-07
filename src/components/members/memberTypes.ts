/** member_streamer_profile — 회원과 1:1, 선택 입력 */
export type MemberStreamerProfileFields = {
    instagramUrl?: string;
    youtubeUrl?: string;
    soopChannelUrl?: string;
    /** 공통코드 code_value (컴퍼니/팀) */
    companyCategoryCode?: string;
    bloodType?: string;
    careerHistory?: string;
};

export type Member = {
    memberSeq?: number;
    memberId: string;
    memberName: string;
    /** 게시·댓글 등에 노출되는 닉네임 */
    nickname?: string;
    memberPwd?: string;
    birthYmd?: string;
    gender?: "M" | "F";
    phone?: string;
    email?: string;
    profileImageUrl?: string | null;
    /** attach_file.file_seq */
    profileImageFileSeq?: number | null;
    region?: string;
    gradeCode?: string;
    status?: "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
    roleCode?: string;
    roleName?: string;
    lastLoginAt?: string;
    streamerProfile?: MemberStreamerProfileFields | null;
};
