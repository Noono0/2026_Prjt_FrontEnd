export type FieldErrorResponse = {
    field: string;
    code: string;
    message: string;
};

export type ApiResponse<T> = {
    success: boolean;
    code?: string;
    message?: string;
    data: T;
    errors?: FieldErrorResponse[];
};

export type PageResponse<T> = {
    items: T[];
    page: number;
    size: number;
    totalCount: number;
    totalPages?: number;
};

export type CodeGroupSearchCondition = {
    codeGroupSeq?: number;
    codeGroupId?: string;
    codeGroupName?: string;
    useYn?: string;
    delYn?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

export type CodeGroupRow = {
    codeGroupSeq?: number;
    codeGroupId?: string;
    codeGroupName?: string;
    description?: string;
    sortOrder?: number;
    useYn?: string;
    delYn?: string;
    createId?: string;
    createIp?: string;
    createDt?: string;
    modifyId?: string;
    modifyIp?: string;
    modifyDt?: string;
};

export type CodeDetailSearchCondition = {
    codeDetailSeq?: number;
    codeGroupSeq?: number;
    parentDetailSeq?: number;
    codeId?: string;
    codeName?: string;
    codeLevel?: number;
    useYn?: string;
    delYn?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

export type CodeDetailRow = {
    codeDetailSeq?: number;
    codeGroupSeq?: number;
    parentDetailSeq?: number;
    codeId?: string;
    codeValue?: string;
    codeName?: string;
    codeLevel?: number;
    description?: string;
    sortOrder?: number;
    useYn?: string;
    delYn?: string;
    attr1?: string;
    attr2?: string;
    attr3?: string;
    createId?: string;
    createIp?: string;
    createDt?: string;
    modifyId?: string;
    modifyIp?: string;
    modifyDt?: string;
};

export class ApiError extends Error {
    code?: string;
    errors?: FieldErrorResponse[];
    status?: number;

    constructor(
        message: string,
        options?: { code?: string; errors?: FieldErrorResponse[]; status?: number }
    ) {
        super(message);
        this.name = "ApiError";
        this.code = options?.code;
        this.errors = options?.errors;
        this.status = options?.status;
    }
}

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(input, {
        cache: "no-store",
        ...init,
    });

    let json: ApiResponse<T> | null = null;

    try {
        json = (await res.json()) as ApiResponse<T>;
    } catch {
        if (!res.ok) {
            throw new ApiError("요청 처리 중 오류가 발생했습니다.", {
                status: res.status,
            });
        }
        throw new ApiError("응답 형식이 올바르지 않습니다.", {
            status: res.status,
        });
    }

    if (!res.ok || !json.success) {
        throw new ApiError(json?.message ?? "요청 처리 중 오류가 발생했습니다.", {
            code: json?.code,
            errors: json?.errors ?? [],
            status: res.status,
        });
    }

    return json;
}

/** code group */
export async function searchCodeGroups(
    condition: CodeGroupSearchCondition
): Promise<PageResponse<CodeGroupRow>> {
    const result = await apiFetch<PageResponse<CodeGroupRow>>("/api/code-groups/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });
    return result.data;
}

export async function fetchCodeGroupDetail(codeGroupSeq: number): Promise<CodeGroupRow> {
    const result = await apiFetch<CodeGroupRow>("/api/code-groups/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeGroupSeq }),
    });
    return result.data;
}

export async function saveCodeGroup(row: CodeGroupRow, mode: "create" | "edit") {
    const payload = {
        codeGroupSeq: row.codeGroupSeq,
        codeGroupId: row.codeGroupId ?? "",
        codeGroupName: row.codeGroupName ?? "",
        description: row.description ?? "",
        sortOrder: row.sortOrder ?? 0,
        useYn: row.useYn ?? "Y",
        delYn: row.delYn ?? "N",
    };

    if (mode === "create") {
        return apiFetch<number>("/api/code-groups/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    return apiFetch<number>("/api/code-groups/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function deleteCodeGroup(codeGroupSeq: number) {
    return apiFetch<number>("/api/code-groups/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeGroupSeq }),
    });
}

/** code detail */
export async function searchCodeDetails(
    condition: CodeDetailSearchCondition
): Promise<PageResponse<CodeDetailRow>> {
    const result = await apiFetch<PageResponse<CodeDetailRow>>("/api/code-details/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(condition),
    });
    return result.data;
}

export async function fetchCodeDetail(codeDetailSeq: number): Promise<CodeDetailRow> {
    const result = await apiFetch<CodeDetailRow>("/api/code-details/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeDetailSeq }),
    });
    return result.data;
}

export async function saveCodeDetail(row: CodeDetailRow, mode: "create" | "edit") {
    const payload = {
        codeDetailSeq: row.codeDetailSeq,
        codeGroupSeq: row.codeGroupSeq,
        parentDetailSeq: row.parentDetailSeq,
        codeId: row.codeId ?? "",
        codeValue: row.codeValue ?? "",
        codeName: row.codeName ?? "",
        codeLevel: row.codeLevel ?? 2,
        description: row.description ?? "",
        sortOrder: row.sortOrder ?? 0,
        useYn: row.useYn ?? "Y",
        delYn: row.delYn ?? "N",
        attr1: row.attr1 ?? "",
        attr2: row.attr2 ?? "",
        attr3: row.attr3 ?? "",
    };

    if (mode === "create") {
        return apiFetch<number>("/api/code-details/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    return apiFetch<number>("/api/code-details/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function deleteCodeDetail(codeDetailSeq: number) {
    return apiFetch<number>("/api/code-details/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeDetailSeq }),
    });
}