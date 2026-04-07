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
  /** NextAuth 직후 Spring JSESSION 연동 대기 중이면 true — 지갑 등 /api/* 호출 전 spring-sync 필요 */
  oauthSpringPending: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  /** NextAuth OAuth + Spring 동기화용 — DB member_id / memberSeq */
  setOAuthUser: (u: {
    username: string;
    memberSeq?: number;
    memberName?: string;
    nickname?: string;
    profileImageUrl?: string;
  }) => void;
  markOAuthSpringDone: () => void;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  oauthSpringPending: false,
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
          nickname: json.data?.nickname,
        },
        oauthSpringPending: false,
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
      set({ user: null, oauthSpringPending: false });
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
          },
          oauthSpringPending: false,
        });
      } else if (!get().oauthSpringPending) {
        set({ user: null });
      }
    } catch {
      if (!get().oauthSpringPending) {
        set({ user: null });
      }
    }
  },
  setOAuthUser: (u) =>
    set({
      user: {
        username: u.username,
        memberSeq: u.memberSeq,
        nickname: u.nickname,
        profileImageUrl: u.profileImageUrl,
      },
      oauthSpringPending: true,
    }),
  markOAuthSpringDone: () => set({ oauthSpringPending: false }),
}));
