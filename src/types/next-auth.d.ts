import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      /** Spring member.member_id (OAuth 동기화 후) */
      memberId?: string;
      memberSeq?: number;
    };
    accessToken?: string;
    profile?: unknown;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendMemberId?: string;
    backendMemberSeq?: number;
  }
}
