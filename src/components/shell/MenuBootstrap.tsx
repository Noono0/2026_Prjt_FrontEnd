"use client";

import { useEffect } from "react";
import { useMenuStore } from "@/stores/menuStore";
import {
    fetchAllMenusForSidebar,
    toExtraMenuTree,
} from "@/features/menus/sidebarApi";

export default function MenuBootstrap() {
    const setExtraMenu = useMenuStore((s) => s.setExtraMenu);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const rows = await fetchAllMenusForSidebar();
                const extraTree = toExtraMenuTree(rows);

                if (mounted) {
                    setExtraMenu(extraTree);
                }
            } catch (error) {
                console.error("추가 메뉴 로딩 실패", error);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [setExtraMenu]);

    return null;
}