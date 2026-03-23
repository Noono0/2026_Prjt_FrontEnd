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