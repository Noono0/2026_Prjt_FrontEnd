"use client";

/** TanStack Query — 공통코드 API. 요약: `src/lib/STATE-LIBS.md` */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    deleteCodeDetail,
    deleteCodeGroup,
    fetchCodeDetail,
    fetchCodeGroupDetail,
    saveCodeDetail,
    saveCodeGroup,
    searchCodeDetails,
    searchCodeGroups,
    type CodeDetailRow,
    type CodeDetailSearchCondition,
    type CodeGroupRow,
    type CodeGroupSearchCondition,
} from "./api";

export const commonCodeKeys = {
    all: ["commonCodes"] as const,

    groups: ["commonCodes", "groups"] as const,
    groupList: (condition: CodeGroupSearchCondition) => ["commonCodes", "groups", "list", condition] as const,
    groupDetail: (codeGroupSeq?: number) => ["commonCodes", "groups", "detail", codeGroupSeq] as const,

    details: ["commonCodes", "details"] as const,
    detailList: (condition: CodeDetailSearchCondition) => ["commonCodes", "details", "list", condition] as const,
    detailDetail: (codeDetailSeq?: number) => ["commonCodes", "details", "detail", codeDetailSeq] as const,
};

export function useCodeGroupsQuery(condition: CodeGroupSearchCondition) {
    return useQuery({
        queryKey: commonCodeKeys.groupList(condition),
        queryFn: () => searchCodeGroups(condition),
    });
}

export function useCodeGroupDetailQuery(codeGroupSeq?: number) {
    return useQuery({
        queryKey: commonCodeKeys.groupDetail(codeGroupSeq),
        queryFn: () => fetchCodeGroupDetail(codeGroupSeq!),
        enabled: !!codeGroupSeq,
    });
}

function defaultEnabledForCodeDetailSearch(c: CodeDetailSearchCondition): boolean {
    if (!c.codeGroupSeq) return false;
    if (c.codeLevel === 3) return !!c.parentDetailSeq;
    if (c.codeLevel === 2) return true;
    return !!(c.parentDetailSeq || c.codeDetailSeq);
}

export function useCodeDetailsQuery(condition: CodeDetailSearchCondition, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: commonCodeKeys.detailList(condition),
        queryFn: () => searchCodeDetails(condition),
        enabled: options?.enabled ?? defaultEnabledForCodeDetailSearch(condition),
    });
}

export function useCodeDetailQuery(codeDetailSeq?: number) {
    return useQuery({
        queryKey: commonCodeKeys.detailDetail(codeDetailSeq),
        queryFn: () => fetchCodeDetail(codeDetailSeq!),
        enabled: !!codeDetailSeq,
    });
}

export function useSaveCodeGroupMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ row, mode }: { row: CodeGroupRow; mode: "create" | "edit" }) => saveCodeGroup(row, mode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commonCodeKeys.groups });
        },
    });
}

export function useDeleteCodeGroupMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (codeGroupSeq: number) => deleteCodeGroup(codeGroupSeq),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commonCodeKeys.groups });
            queryClient.invalidateQueries({ queryKey: commonCodeKeys.details });
        },
    });
}

export function useSaveCodeDetailMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ row, mode }: { row: CodeDetailRow; mode: "create" | "edit" }) => saveCodeDetail(row, mode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commonCodeKeys.details });
        },
    });
}

export function useDeleteCodeDetailMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (codeDetailSeq: number) => deleteCodeDetail(codeDetailSeq),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commonCodeKeys.details });
        },
    });
}
