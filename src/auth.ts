import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import { API_BASE_URL } from "@/lib/config";

const providers: NextAuthConfig["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    );
}

if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
    providers.push(
        Kakao({
            clientId: process.env.KAKAO_CLIENT_ID,
            clientSecret: process.env.KAKAO_CLIENT_SECRET,
        })
    );
}

if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
    providers.push(
        Naver({
            clientId: process.env.NAVER_CLIENT_ID,
            clientSecret: process.env.NAVER_CLIENT_SECRET,
        })
    );
}

if (providers.length === 0) {
    providers.push(
        Credentials({
            id: "local-disabled",
            name: "Local Disabled",
            credentials: {},
            async authorize() {
                return null;
            },
        })
    );
}

const config = {
    providers,
    session: { strategy: "jwt" as const },
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    trustHost: true,
    pages: { signIn: "/" },
    callbacks: {
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
                            console.error("[auth] oauth/sync 실패", res.status, json);
                        }
                    } catch (e) {
                        console.error("[auth] oauth/sync 오류", e);
                    }
                } else if (providerCode && !secret) {
                    console.warn("[auth] OAUTH_SYNC_SECRET 미설정 — member 동기화 생략");
                }
            }
            if (account?.access_token) (token as { accessToken?: string }).accessToken = account.access_token;
            if (profile) (token as { profile?: unknown }).profile = profile;
            return token;
        },
        async session({ session, token }) {
            if (token.backendMemberId) {
                session.user.memberId = token.backendMemberId as string;
                session.user.memberSeq = token.backendMemberSeq as number;
            }
            session.accessToken = (token as { accessToken?: string }).accessToken;
            session.profile = (token as { profile?: unknown }).profile;
            return session;
        },
    },
} satisfies NextAuthConfig;

export const { auth, handlers, signIn, signOut } = NextAuth(config);
