"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRole, saveRole, searchRoles, type RoleRow, type RoleSearchCondition } from "./api";

export const roleAdminKeys = {
    all: ["roles-admin"] as const,
    list: (condition: RoleSearchCondition) => ["roles-admin", "list", condition] as const,
};

export function useRolesAdminQuery(condition: RoleSearchCondition) {
    return useQuery({
        queryKey: roleAdminKeys.list(condition),
        queryFn: () => searchRoles(condition),
        staleTime: 0,
    });
}

export function useSaveRoleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ row, mode }: { row: RoleRow; mode: "create" | "edit" }) =>
            saveRole(row, mode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleAdminKeys.all });
        },
    });
}

export function useDeleteRoleMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roleId: number) => deleteRole(roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleAdminKeys.all });
        },
    });
}
