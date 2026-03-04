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
