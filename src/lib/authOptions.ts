import type { NextAuthOptions } from "next-auth";
import { API_BASE_URL } from "@/lib/config";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import NaverProvider from "next-auth/providers/naver";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Social login is handled by NextAuth.
 * If you also need to authenticate your Spring Boot API,
 * implement an exchange step in callbacks (e.g., send provider token to backend and receive your JWT).
 */
export const authOptions: NextAuthOptions = {
  providers: (() => {
    const providers: any[] = [];

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      providers.push(
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
      );
    }

    if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
      providers.push(
        KakaoProvider({
          clientId: process.env.KAKAO_CLIENT_ID,
          clientSecret: process.env.KAKAO_CLIENT_SECRET,
        })
      );
    }

    if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
      providers.push(
        NaverProvider({
          clientId: process.env.NAVER_CLIENT_ID,
          clientSecret: process.env.NAVER_CLIENT_SECRET,
        })
      );
    }

    if (providers.length === 0) {
      providers.push(
        CredentialsProvider({
          id: "local-disabled",
          name: "Local Disabled",
          credentials: {},
          async authorize() {
            return null;
          },
        })
      );
    }

    return providers;
  })(),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
  callbacks: {
    /** OAuth 최초 로그인 시에만 account 가 전달됨 — 여기서 Spring member 동기화 후 JWT 에 DB member_id·seq 저장 */
    async jwt({ token, user, account, profile }) {
      if (account?.type === "oauth" && account.provider) {
        const providerMap: Record<string, string> = {
          google: "GOOGLE",
          kakao: "KAKAO",
          naver: "NAVER",
        };
        const providerCode = providerMap[account.provider];
        const secret = process.env.OAUTH_SYNC_SECRET;
        if (providerCode && secret) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/auth/oauth/sync`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-OAuth-Sync-Secret": secret,
              },
              body: JSON.stringify({
                provider: providerCode,
                subject: account.providerAccountId,
                email: user?.email ?? undefined,
                memberName: user?.name ?? undefined,
                nickname: user?.name ?? undefined,
                profileImageUrl: user?.image ?? undefined,
              }),
              cache: "no-store",
            });
            const json = (await res.json()) as {
              success?: boolean;
              data?: { memberId?: string; memberSeq?: number };
            };
            if (res.ok && json.success && json.data?.memberId && json.data.memberSeq != null) {
              token.backendMemberId = json.data.memberId;
              token.backendMemberSeq = json.data.memberSeq;
            } else {
              console.error("[next-auth] oauth/sync 실패", res.status, json);
            }
          } catch (e) {
            console.error("[next-auth] oauth/sync 오류", e);
          }
        } else if (providerCode && !secret) {
          console.warn("[next-auth] OAUTH_SYNC_SECRET 미설정 — member 동기화 생략");
        }
      }
      if (account?.access_token) (token as any).accessToken = account.access_token;
      if (profile) (token as any).profile = profile;
      return token;
    },
    async session({ session, token }) {
      if (token.backendMemberId) {
        session.user.memberId = token.backendMemberId;
        session.user.memberSeq = token.backendMemberSeq;
      }
      session.accessToken = (token as any).accessToken;
      session.profile = (token as any).profile;
      return session;
    },
  },
};
