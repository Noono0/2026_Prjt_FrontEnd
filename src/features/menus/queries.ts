"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    deleteMenu,
    fetchMenuTree,
    saveMenu,
    searchMenus,
    type MenuRow,
    type MenuSearchCondition,
} from "./api";

export const menuAdminKeys = {
    all: ["menus-admin"] as const,
    tree: ["menus-admin", "tree"] as const,
    list: (condition: MenuSearchCondition) => ["menus-admin", "list", condition] as const,
};

export function useMenuTreeQuery() {
    return useQuery({
        queryKey: menuAdminKeys.tree,
        queryFn: fetchMenuTree,
        staleTime: 0,
    });
}

export function useMenusAdminQuery(condition: MenuSearchCondition) {
    return useQuery({
        queryKey: menuAdminKeys.list(condition),
        queryFn: () => searchMenus(condition),
        staleTime: 0,
    });
}

export function useSaveMenuMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ row, mode }: { row: MenuRow; mode: "create" | "edit" }) =>
            saveMenu(row, mode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuAdminKeys.all });
        },
    });
}

export function useDeleteMenuMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (menuId: number) => deleteMenu(menuId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: menuAdminKeys.all });
        },
    });
}
