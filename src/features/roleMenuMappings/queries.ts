"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchActiveRoles, fetchRoleMenuAssignments, saveRoleMenuMappings } from "./api";

export const roleMenuMappingKeys = {
    all: ["role-menu-mappings"] as const,
    assignments: (roleId: number) => [...roleMenuMappingKeys.all, "assignments", roleId] as const,
};

export function useActiveRolesForMappingQuery() {
    return useQuery({
        queryKey: ["active-roles", "mapping"],
        queryFn: fetchActiveRoles,
        staleTime: 60_000,
    });
}

export function useRoleMenuAssignmentsQuery(roleId: number | null) {
    return useQuery({
        queryKey: roleMenuMappingKeys.assignments(roleId ?? 0),
        queryFn: () => fetchRoleMenuAssignments(roleId!),
        enabled: roleId != null && roleId > 0,
    });
}

export function useSaveRoleMenuMappingsMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveRoleMenuMappings,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: roleMenuMappingKeys.all });
            queryClient.invalidateQueries({
                queryKey: roleMenuMappingKeys.assignments(variables.roleId),
            });
        },
    });
}

export type { RoleMenuAssignment } from "./api";
