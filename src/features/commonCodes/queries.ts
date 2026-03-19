"use client";

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
    groupList: (condition: CodeGroupSearchCondition) =>
        ["commonCodes", "groups", "list", condition] as const,
    groupDetail: (codeGroupSeq?: number) =>
        ["commonCodes", "groups", "detail", codeGroupSeq] as const,

    details: ["commonCodes", "details"] as const,
    detailList: (condition: CodeDetailSearchCondition) =>
        ["commonCodes", "details", "list", condition] as const,
    detailDetail: (codeDetailSeq?: number) =>
        ["commonCodes", "details", "detail", codeDetailSeq] as const,
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

export function useCodeDetailsQuery(condition: CodeDetailSearchCondition) {
    return useQuery({
        queryKey: commonCodeKeys.detailList(condition),
        queryFn: () => searchCodeDetails(condition),
        enabled: !!condition.codeGroupSeq || !!condition.parentDetailSeq || !!condition.codeDetailSeq,
    });
}

export function useCodeDetailQuery(codeDetailSeq?: number) {
    return useQuery({
        queryKey: commonCodeKeys.detailDetail(codeDetailSeq),
        queryFn: () => fetchCodeDetail(codeDetailSeq!),
        enabled: !!codeDetailSeq,
    });
}

export function useSaveCodeGroupMutation(mode: "create" | "edit") {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (row: CodeGroupRow) => saveCodeGroup(row, mode),
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

export function useSaveCodeDetailMutation(mode: "create" | "edit") {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (row: CodeDetailRow) => saveCodeDetail(row, mode),
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