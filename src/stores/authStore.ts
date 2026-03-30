import { create } from "zustand";

export type User = {
  username: string;
  memberSeq?: number;
  profileImageUrl?: string;
  /** 닉네임(표시 우선) */
  nickname?: string;
  memberName?: string;
};

type AuthState = {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

type LoginApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    memberSeq?: number;
    memberId?: string;
    profileImageUrl?: string;
    nickname?: string;
    memberName?: string;
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: async (username, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          memberId: username,
          memberPwd: password,
        }),
      });

      const json = (await res.json()) as LoginApiResponse;
      if (!res.ok || !json.success) {
        return false;
      }

      set({
        user: {
          username: json.data?.memberId ?? username,
          memberSeq: json.data?.memberSeq,
          profileImageUrl: json.data?.profileImageUrl,
          memberName: json.data?.memberName,
        },
      });
      return true;
    } catch {
      return false;
    }
  },
  logout: async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      set({ user: null });
    }
  },
  restoreSession: async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });
      const json = (await res.json()) as LoginApiResponse;
      if (res.ok && json.success && json.data?.memberId) {
        set({
          user: {
            username: json.data.memberId,
            memberSeq: json.data.memberSeq,
            profileImageUrl: json.data.profileImageUrl,
            nickname: json.data.nickname,
            memberName: json.data.memberName,
          },
        });
      } else {
        set({ user: null });
      }
    } catch {
      set({ user: null });
    }
  },
}));
