export type SiteSupportCategoryCode = "AD" | "SPONSOR" | "HELPER";

export type SiteSupportRow = {
    supportSeq?: number;
    categoryCode?: string;
    title?: string;
    content?: string;
    linkUrl?: string | null;
    sortOrder?: number;
    showYn?: string;
    createDt?: string;
    modifyDt?: string;
    createId?: string;
    modifyId?: string;
    createIp?: string;
    modifyIp?: string;
};

export type SiteSupportSearchCondition = {
    keyword?: string;
    categoryCode?: string;
    showYn?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};
