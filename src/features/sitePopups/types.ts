export type SitePopupListItem = {
    sitePopupSeq?: number;
    title?: string;
    content?: string;
    showYn?: string;
    popupYn?: string;
    popupType?: string;
    popupWidth?: number;
    popupHeight?: number;
    popupPosX?: number | null;
    popupPosY?: number | null;
    popupStartDt?: string | null;
    popupEndDt?: string | null;
    sortOrder?: number;
    createDt?: string;
    modifyDt?: string;
};

export type SitePopupSearchCondition = {
    title?: string;
    keyword?: string;
    showYn?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};
