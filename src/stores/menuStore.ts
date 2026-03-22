import { create } from "zustand";

export type MenuNode = {
  id: string;
  name: string;
  icon?: string;
  path?: string;
  children?: MenuNode[];
};

/**
 * 요구사항: 4-depth 메뉴 지원
 * - 실제 운영에서는 backend에서 메뉴/권한을 내려받아 store를 채우면 됨.
 */
const defaultMenu: MenuNode[] = [
  {
    id: "m1",
    name: "회원관리",
    icon: "👤",
    children: [
      { id: "m1-1", name: "회원 목록", path: "/members" },
      {
        id: "m1-2",
        name: "회원 통계(예시)",
        children: [
          { id: "m1-2-1", name: "가입 추이", path: "/members" },
          {
            id: "m1-2-2",
            name: "세부(4depth 예시)",
            children: [{ id: "m1-2-2-1", name: "리포트", path: "/members" }],
          },
        ],
      },
    ],
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
  menu: MenuNode[];
  setMenu: (menu: MenuNode[]) => void;
};

export const useMenuStore = create<MenuState>((set) => ({
  menu: defaultMenu,
  setMenu: (menu) => set({ menu }),
}));