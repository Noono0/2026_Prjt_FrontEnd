export type ContentFilterWordRow = {
    contentFilterWordSeq: number;
    category: string;
    keyword: string;
    useYn?: string;
    sortOrder?: number;
    remark?: string | null;
    createDt?: string;
    modifyDt?: string;
};

export type ContentFilterWordSearchCondition = {
    page: number;
    size: number;
    sortBy?: string;
    sortDir?: string;
    keyword?: string;
    category?: string;
};

export type ContentFilterWordSaveBody = {
    contentFilterWordSeq?: number;
    category: string;
    keyword: string;
    useYn?: string;
    sortOrder?: number;
    remark?: string | null;
};
