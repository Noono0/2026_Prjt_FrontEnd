"use client";

/**
 * 회원 생성/수정 모달 — React Hook Form + Zod + zodResolver.
 * - 스키마/기본값: `memberFormSchema.ts`
 * - 역할 목록 등 서버 데이터: `features/members/queries.ts` 의 useRolesQuery (TanStack Query)
 * 라이브러리 위치 요약: `src/lib/STATE-LIBS.md`
 */
import React, { useEffect, useMemo } from "react";
import { useForm, type Resolver, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "./MemberFormModal.module.css";
import { useRolesQuery } from "@/features/members/queries";
import type { RoleItem } from "@/features/members/api";
import type { Member } from "./memberTypes";
import {
    buildMemberFormSchema,
    emptyMemberFormValues,
    seedToMemberFormValues,
    type MemberFormValues,
} from "./memberFormSchema";

export type { Member, MemberStreamerProfileFields } from "./memberTypes";

function PhonePartInput({
    register,
    name,
    className,
}: {
    register: UseFormRegister<MemberFormValues>;
    name: "phone2" | "phone3";
    className: string;
}) {
    const { onChange, ...rest } = register(name);
    return (
        <input
            {...rest}
            className={className}
            maxLength={4}
            onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                const ev = { ...e, target: { ...e.target, value: v } } as React.ChangeEvent<HTMLInputElement>;
                onChange(ev);
            }}
        />
    );
}

type Props = {
    open: boolean;
    mode: "create" | "edit";
    initial?: Member | null;
    onClose: () => void;
    onSave: (member: Member) => Promise<void> | void;
};

function toApiBirthYmd(birthYmd?: string) {
    if (!birthYmd) return "";
    return birthYmd.replaceAll("-", "");
}

function joinEmail(local: string, domain: string) {
    const l = local.trim();
    const d = domain.trim();
    if (!l || !d) return "";
    return `${l}@${d}`;
}

function joinPhone(p1: string, p2: string, p3: string) {
    const a = p1.trim();
    const b = p2.trim();
    const c = p3.trim();
    if (!b && !c) return "";
    return `${a}-${b}-${c}`;
}

function createEmptyMemberSeed(): Member {
    return {
        memberSeq: undefined,
        memberId: "",
        memberName: "",
        nickname: "",
        memberPwd: "",
        birthYmd: "",
        gender: "M",
        phone: "",
        email: "",
        status: "ACTIVE",
        roleCode: "",
        roleName: "",
        streamerProfile: emptyMemberFormValues().streamerProfile,
    };
}

function buildMemberPayload(values: MemberFormValues, mode: "create" | "edit", initial: Member | null): Member {
    return {
        memberSeq: initial?.memberSeq ?? values.memberSeq,
        memberId: values.memberId,
        memberName: values.memberName,
        nickname: values.nickname?.trim() ? values.nickname : undefined,
        memberPwd: mode === "edit" && !(values.memberPwd ?? "").trim() ? undefined : values.memberPwd || undefined,
        birthYmd: toApiBirthYmd(values.birthYmd),
        gender: values.gender,
        phone: joinPhone(values.phone1, values.phone2, values.phone3),
        email: joinEmail(values.emailLocal, values.emailDomain),
        profileImageUrl: initial?.profileImageUrl ?? null,
        profileImageFileSeq: initial?.profileImageFileSeq ?? null,
        region: initial?.region,
        status: values.status,
        roleCode: values.roleCode,
        roleName: initial?.roleName,
        lastLoginAt: initial?.lastLoginAt,
        streamerProfile: {
            ...values.streamerProfile,
        },
    };
}

export default function MemberFormModal({ open, mode, initial, onClose, onSave }: Props) {
    const title = mode === "create" ? "회원 등록" : "회원 수정";
    const schema = useMemo(() => buildMemberFormSchema(mode), [mode]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<MemberFormValues>({
        resolver: zodResolver(schema) as Resolver<MemberFormValues>,
        defaultValues: emptyMemberFormValues(),
    });

    const { data: roleOptions = [], isLoading: rolesLoading } = useRolesQuery();

    useEffect(() => {
        if (!open) return;
        const base = initial ?? createEmptyMemberSeed();
        reset(seedToMemberFormValues(base));
    }, [open, mode, initial, initial?.memberSeq, initial?.memberId, reset]);

    if (!open) return null;

    const onValid = async (values: MemberFormValues) => {
        await onSave(buildMemberPayload(values, mode, initial ?? null));
        onClose();
    };

    const fieldErr = (msg?: string) => (msg ? <div className={styles.fieldError}>{msg}</div> : null);

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <form onSubmit={handleSubmit(onValid)} noValidate>
                    <div className={styles.header}>
                        <div className={styles.title}>{title}</div>
                        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
                            ✕
                        </button>
                    </div>

                    <div className={styles.content}>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <div className={styles.label}>아이디 *</div>
                                <input
                                    className={styles.input}
                                    {...register("memberId")}
                                    disabled={mode === "edit"}
                                    placeholder="예) user0001"
                                    aria-invalid={Boolean(errors.memberId)}
                                />
                                {fieldErr(errors.memberId?.message)}
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>성명 *</div>
                                <input
                                    className={styles.input}
                                    {...register("memberName")}
                                    aria-invalid={Boolean(errors.memberName)}
                                />
                                {fieldErr(errors.memberName?.message)}
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>닉네임</div>
                                <input
                                    className={styles.input}
                                    {...register("nickname")}
                                    placeholder="게시글·댓글에 표시"
                                />
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>비밀번호 {mode === "create" ? "*" : ""}</div>
                                <input
                                    className={styles.input}
                                    type="password"
                                    {...register("memberPwd")}
                                    placeholder={mode === "create" ? "비밀번호 입력" : "변경할 때만 입력"}
                                    aria-invalid={Boolean(errors.memberPwd)}
                                />
                                {fieldErr(errors.memberPwd?.message)}
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>생년월일</div>
                                <input className={styles.input} type="date" {...register("birthYmd")} />
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>성별</div>
                                <select className={styles.select} {...register("gender")}>
                                    <option value="M">남</option>
                                    <option value="F">여</option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>휴대폰 번호</div>
                                <div className={styles.inline}>
                                    <select
                                        className={`${styles.select} ${styles.phoneSelect}`}
                                        {...register("phone1")}
                                    >
                                        <option value="010">010</option>
                                        <option value="011">011</option>
                                        <option value="016">016</option>
                                        <option value="017">017</option>
                                        <option value="018">018</option>
                                        <option value="019">019</option>
                                    </select>
                                    <span className={styles.sep}>-</span>
                                    <PhonePartInput
                                        register={register}
                                        name="phone2"
                                        className={`${styles.input} ${styles.phoneInput}`}
                                    />
                                    <span className={styles.sep}>-</span>
                                    <PhonePartInput
                                        register={register}
                                        name="phone3"
                                        className={`${styles.input} ${styles.phoneInput}`}
                                    />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>이메일</div>
                                <div className={styles.inline}>
                                    <input
                                        className={`${styles.input} ${styles.smallInput}`}
                                        {...register("emailLocal")}
                                        placeholder="user"
                                    />
                                    <span className={styles.sep}>@</span>
                                    <select
                                        className={`${styles.select} ${styles.smallSelect}`}
                                        {...register("emailDomain")}
                                    >
                                        <option value="naver.com">naver.com</option>
                                        <option value="gmail.com">gmail.com</option>
                                        <option value="kakao.com">kakao.com</option>
                                        <option value="google.com">google.com</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>회원 권한 *</div>
                                <select
                                    className={styles.select}
                                    {...register("roleCode")}
                                    disabled={rolesLoading}
                                    aria-invalid={Boolean(errors.roleCode)}
                                >
                                    <option value="">{rolesLoading ? "불러오는 중..." : "선택하세요"}</option>
                                    {roleOptions.map((r: RoleItem) => {
                                        const roleId = r.roleId ?? r.id ?? r.role_seq ?? r.role_seq_no ?? r.role_no;
                                        const roleCode =
                                            r.roleCode ??
                                            r.role_code ??
                                            r.code ??
                                            r.roleId?.toString() ??
                                            r.id?.toString() ??
                                            "";
                                        const roleName = r.roleName ?? r.role_name ?? r.name ?? r.roleCode ?? roleCode;
                                        return (
                                            <option key={roleId ?? roleCode} value={roleCode}>
                                                {roleName}
                                            </option>
                                        );
                                    })}
                                </select>
                                {fieldErr(errors.roleCode?.message)}
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>회원 상태</div>
                                <select className={styles.select} {...register("status")}>
                                    <option value="ACTIVE">정상</option>
                                    <option value="SUSPENDED">정지</option>
                                    <option value="WITHDRAWN">탈퇴</option>
                                </select>
                            </div>

                            <div className={styles.sectionTitle}>스트리머·컴퍼니 정보 (선택)</div>

                            <div className={styles.field}>
                                <div className={styles.label}>인스타그램 URL</div>
                                <input
                                    className={styles.input}
                                    {...register("streamerProfile.instagramUrl")}
                                    placeholder="https://"
                                />
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>유튜브 URL</div>
                                <input
                                    className={styles.input}
                                    {...register("streamerProfile.youtubeUrl")}
                                    placeholder="https://"
                                />
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>SOOP 방송국 URL</div>
                                <input
                                    className={styles.input}
                                    {...register("streamerProfile.soopChannelUrl")}
                                    placeholder="https://"
                                />
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>컴퍼니 카테고리 코드</div>
                                <input
                                    className={styles.input}
                                    {...register("streamerProfile.companyCategoryCode")}
                                    placeholder="공통코드 code_value"
                                />
                            </div>

                            <div className={styles.field}>
                                <div className={styles.label}>혈액형</div>
                                <input
                                    className={styles.input}
                                    {...register("streamerProfile.bloodType")}
                                    placeholder="예) A"
                                    maxLength={10}
                                />
                            </div>

                            <div className={`${styles.field} ${styles.row}`}>
                                <div className={styles.label}>약력·이력</div>
                                <textarea
                                    className={styles.textarea}
                                    {...register("streamerProfile.careerHistory")}
                                    placeholder="방송·활동 이력 등"
                                    rows={5}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button type="button" className={styles.btn} onClick={onClose} disabled={isSubmitting}>
                            취소
                        </button>
                        <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={isSubmitting}>
                            {isSubmitting ? "저장중..." : "저장"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
