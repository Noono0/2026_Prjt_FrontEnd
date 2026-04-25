"use client";

/**
 * 회원 도메인 — TanStack Query 훅 모음 (목록/역할 조회, 저장/삭제 뮤테이션).
 * MembersPage·MemberFormModal 등에서 import 해 사용합니다.
 * Zustand와 구분: 여기는 “서버에서 가져온 데이터” 캐시에 가깝습니다.
 * 요약: `src/lib/STATE-LIBS.md`
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Member } from "@/components/members/memberTypes";
import { deleteMembers, fetchRoles, saveMember, searchMembers, type MemberSearchCondition } from "./api";

export const memberKeys = {
    all: ["members"] as const,
    list: (condition: MemberSearchCondition) => ["members", "list", condition] as const,
    roles: ["members", "roles"] as const,
};

export function useMembersQuery(condition: MemberSearchCondition) {
    return useQuery({
        queryKey: memberKeys.list(condition),
        queryFn: () => searchMembers(condition),
        staleTime: 0,
    });
}

export function useRolesQuery() {
    return useQuery({
        queryKey: memberKeys.roles,
        queryFn: fetchRoles,
        staleTime: 10 * 60 * 1000,
    });
}

export function useSaveMemberMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ member, mode }: { member: Member; mode: "create" | "edit" }) => saveMember(member, mode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: memberKeys.all });
        },
    });
}

export function useDeleteMembersMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (memberSeqList: number[]) => deleteMembers(memberSeqList),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: memberKeys.all });
        },
    });
}
