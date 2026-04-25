/** Zustand — 레이아웃 UI(사이드바·로그인 모달). 요약: `src/lib/STATE-LIBS.md` */
import { create } from "zustand";

type UIState = {
    sidebarOpen: boolean;
    loginOpen: boolean;
    toggleSidebar: () => void;
    openLogin: () => void;
    closeLogin: () => void;
};

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    loginOpen: false,
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    openLogin: () => set({ loginOpen: true }),
    closeLogin: () => set({ loginOpen: false }),
}));
