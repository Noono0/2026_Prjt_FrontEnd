import { create } from "zustand";

export type User = { username: string };

type AuthState = {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

function isDemoLogin(username: string, password: string) {
  return (username === "admin" && password === "admin1234") || (username === "cs" && password === "cs1234");
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: async (username, password) => {
    // TODO: backend 연동 시 /api/auth/login 호출로 교체
    if (!isDemoLogin(username, password)) return false;
    set({ user: { username } });
    return true;
  },
  logout: () => set({ user: null }),
}));
