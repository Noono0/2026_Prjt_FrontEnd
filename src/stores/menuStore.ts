/** Zustand — 사이드 메뉴 트리(defaultMenu + extraMenu). 요약: `src/lib/STATE-LIBS.md` */
import { create } from "zustand";

export type MenuNode = {
    id: string;
    name: string;
    icon?: string;
    path?: string;
    children?: MenuNode[];
};

const defaultMenu: MenuNode[] = [
    {
        id: "m1",
        name: "회원관리",
        icon: "👤",
        children: [{ id: "m1-1", name: "회원 목록", path: "/members" }],
    },
    {
        id: "m2",
        name: "권한관리",
        icon: "🛡️",
        children: [
            { id: "m2-1", name: "권한 목록", path: "/roles" },
            { id: "m2-2", name: "역할–메뉴 매핑", path: "/role-menu-mappings" },
        ],
    },
    {
        id: "m3",
        name: "메뉴관리",
        icon: "🧭",
        children: [{ id: "m3-1", name: "메뉴 목록", path: "/menus" }],
    },
    {
        id: "m4",
        name: "공통코드관리",
        icon: "🗂️",
        children: [{ id: "m4-1", name: "공통코드 목록", path: "/common-codes" }],
    },
    {
        id: "m5",
        name: "팝업 관리",
        icon: "🪟",
        children: [
            { id: "m5-1", name: "사이트 팝업", path: "/site-popups" },
            { id: "m5-2", name: "비속어·광고 필터", path: "/content-filter" },
            { id: "m5-3", name: "포인트 정책", path: "/point-policy" },
        ],
    },
    {
        id: "m6",
        name: "게시판111",
        icon: "📅",
        children: [
            { id: "m6-1a", name: "문의게시판", path: "/inquiry-boards" },
            { id: "m6-1", name: "자유게시판", path: "/boards" },
            { id: "m6-1b", name: "블랙리스트 제보", path: "/blacklist-report" },
            { id: "m6-2", name: "일정 달력", path: "/calendar-schedules" },
            { id: "m6-3", name: "포인트 랭킹", path: "/point-ranking" },
            { id: "m6-4", name: "테스트화면", path: "/boards" }, // 연습용
        ],
    },
];

type MenuState = {
    defaultMenu: MenuNode[];
    extraMenu: MenuNode[];
    setExtraMenu: (menu: MenuNode[]) => void;
    clearExtraMenu: () => void;
};

export const useMenuStore = create<MenuState>((set) => ({
    defaultMenu,
    extraMenu: [],
    setExtraMenu: (menu) => set({ extraMenu: menu }),
    clearExtraMenu: () => set({ extraMenu: [] }),
}));
