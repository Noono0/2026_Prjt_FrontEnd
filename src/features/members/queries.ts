"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Member } from "@/components/members/MemberFormModal";
import { deleteMembers, searchMembers, fetchRoles, saveMember } from "./api";

export type MemberSearchCondition = {
    memberId?: string;
    memberName?: string;
    roleCode?: string;
    status?: string;
};

export const memberKeys = {
    all: ["members"] as const,
    list: (condition: MemberSearchCondition) => ["members", "list", condition] as const,
    roles: ["members", "roles"] as const,
};

export function useMembersQuery(condition: MemberSearchCondition) {
    return useQuery({
        queryKey: memberKeys.list(condition),
        queryFn: () => searchMembers(condition),
    });
}

export function useRolesQuery() {
    return useQuery({
        queryKey: memberKeys.roles,
        queryFn: fetchRoles,
        staleTime: 10 * 60 * 1000,
    });
}

export function useSaveMemberMutation(mode: "create" | "edit") {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (member: Member) => saveMember(member, mode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: memberKeys.all });
        },
    });
}

export function useDeleteMembersMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => deleteMembers(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: memberKeys.all });
        },
    });
}