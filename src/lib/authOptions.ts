import type { NextAuthOptions } from "next-auth";
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
    async jwt({ token, account, profile }) {
      if (account?.access_token) (token as any).accessToken = account.access_token;
      if (profile) (token as any).profile = profile;
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).profile = (token as any).profile;
      return session;
    },
  },
};
