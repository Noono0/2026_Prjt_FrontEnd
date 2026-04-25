/**
 * 회원 폼용 Zod 스키마 + 타입. MemberFormModal(RHF)에서 zodResolver로 연결합니다.
 * (자유게시판 글쓰기는 이 패턴을 쓰지 않음 — useState + submit 시 직접 검증)
 * 전체 요약: `src/lib/STATE-LIBS.md`
 */
import { z } from "zod";
import type { Member, MemberStreamerProfileFields } from "./memberTypes";

export const streamerProfileFormSchema = z.object({
    instagramUrl: z.string().optional(),
    youtubeUrl: z.string().optional(),
    soopChannelUrl: z.string().optional(),
    companyCategoryCode: z.string().optional(),
    bloodType: z.string().optional(),
    careerHistory: z.string().optional(),
});

/** RHF + zod — 폼 전용 값 (전화/이메일 분할 포함) */
export type MemberFormValues = {
    memberSeq?: number;
    memberId: string;
    memberName: string;
    nickname: string;
    memberPwd: string;
    birthYmd: string;
    gender: "M" | "F";
    status: "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
    roleCode: string;
    phone1: string;
    phone2: string;
    phone3: string;
    emailLocal: string;
    emailDomain: string;
    streamerProfile: MemberStreamerProfileFields;
};

export function buildMemberFormSchema(mode: "create" | "edit") {
    return z
        .object({
            memberSeq: z.number().optional(),
            memberId: z.string().min(1, "아이디는 필수입니다."),
            memberName: z.string().min(1, "성명은 필수입니다."),
            nickname: z.string().optional(),
            memberPwd: z.string().optional(),
            birthYmd: z.string().optional(),
            gender: z.enum(["M", "F"]),
            status: z.enum(["ACTIVE", "SUSPENDED", "WITHDRAWN"]),
            roleCode: z.string().min(1, "회원 권한은 필수입니다."),
            phone1: z.string().optional(),
            phone2: z.string().optional(),
            phone3: z.string().optional(),
            emailLocal: z.string().optional(),
            emailDomain: z.string().optional(),
            streamerProfile: streamerProfileFormSchema,
        })
        .superRefine((data, ctx) => {
            if (mode === "create" && !(data.memberPwd ?? "").trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "비밀번호는 필수입니다.",
                    path: ["memberPwd"],
                });
            }
        });
}

function toDateInputValue(birthYmd?: string) {
    if (!birthYmd) return "";
    if (/^\d{8}$/.test(birthYmd)) {
        return `${birthYmd.slice(0, 4)}-${birthYmd.slice(4, 6)}-${birthYmd.slice(6, 8)}`;
    }
    return birthYmd;
}

function emptyStreamerProfile(): MemberStreamerProfileFields {
    return {
        instagramUrl: "",
        youtubeUrl: "",
        soopChannelUrl: "",
        companyCategoryCode: "",
        bloodType: "",
        careerHistory: "",
    };
}

export function emptyMemberFormValues(): MemberFormValues {
    return {
        memberSeq: undefined,
        memberId: "",
        memberName: "",
        nickname: "",
        memberPwd: "",
        birthYmd: "",
        gender: "M",
        status: "ACTIVE",
        roleCode: "",
        phone1: "010",
        phone2: "",
        phone3: "",
        emailLocal: "",
        emailDomain: "naver.com",
        streamerProfile: emptyStreamerProfile(),
    };
}

export function seedToMemberFormValues(seed: Member): MemberFormValues {
    const base = emptyMemberFormValues();
    let emailLocal = "";
    let emailDomain = "naver.com";
    if (seed.email) {
        const [local, domain] = seed.email.split("@");
        emailLocal = local ?? "";
        emailDomain = domain ?? "naver.com";
    }
    let phone1 = "010";
    let phone2 = "";
    let phone3 = "";
    if (seed.phone) {
        const [p1, p2, p3] = seed.phone.split("-");
        phone1 = p1 || "010";
        phone2 = p2 || "";
        phone3 = p3 || "";
    }
    return {
        ...base,
        memberSeq: seed.memberSeq,
        memberId: seed.memberId ?? "",
        memberName: seed.memberName ?? "",
        nickname: seed.nickname ?? "",
        memberPwd: "",
        birthYmd: toDateInputValue(seed.birthYmd),
        gender: seed.gender ?? "M",
        status: seed.status ?? "ACTIVE",
        roleCode: seed.roleCode ?? "",
        phone1,
        phone2,
        phone3,
        emailLocal,
        emailDomain,
        streamerProfile: {
            ...emptyStreamerProfile(),
            ...seed.streamerProfile,
        },
    };
}
