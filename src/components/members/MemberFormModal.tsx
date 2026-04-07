"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./MemberFormModal.module.css";
import { useRolesQuery } from "@/features/members/queries";

/** member_streamer_profile — 회원과 1:1, 선택 입력 */
export type MemberStreamerProfileFields = {
  instagramUrl?: string;
  youtubeUrl?: string;
  soopChannelUrl?: string;
  /** 공통코드 code_value (컴퍼니/팀) */
  companyCategoryCode?: string;
  bloodType?: string;
  careerHistory?: string;
};

export type Member = {
  memberSeq?: number;
  memberId: string;
  memberName: string;
  /** 게시·댓글 등에 노출되는 닉네임 */
  nickname?: string;
  memberPwd?: string;
  birthYmd?: string;
  gender?: "M" | "F";
  phone?: string;
  email?: string;
  profileImageUrl?: string | null;
  /** attach_file.file_seq */
  profileImageFileSeq?: number | null;
  region?: string;
  status?: "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
  roleCode?: string;
  roleName?: string;
  lastLoginAt?: string;
  streamerProfile?: MemberStreamerProfileFields | null;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Member | null;
  onClose: () => void;
  onSave: (member: Member) => Promise<void> | void;
};

function toDateInputValue(birthYmd?: string) {
  if (!birthYmd) return "";

  // YYYYMMDD 로 올 수도 있어서 date input 용으로 변환
  if (/^\d{8}$/.test(birthYmd)) {
    return `${birthYmd.slice(0, 4)}-${birthYmd.slice(4, 6)}-${birthYmd.slice(6, 8)}`;
  }

  return birthYmd;
}

function toApiBirthYmd(birthYmd?: string) {
  if (!birthYmd) return "";
  return birthYmd.replaceAll("-", "");
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

export default function MemberFormModal({
                                          open,
                                          mode,
                                          initial,
                                          onClose,
                                          onSave,
                                        }: Props) {
  const title = mode === "create" ? "회원 등록" : "회원 수정";

  const seed = useMemo<Member>(() => {
    return (
        initial ?? {
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
          streamerProfile: emptyStreamerProfile(),
        }
    );
  }, [initial]);

  const [form, setForm] = useState<Member>({
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
    streamerProfile: emptyStreamerProfile(),
  });

  const [saving, setSaving] = useState(false);
  const { data: roleOptions = [], isLoading: rolesLoading } = useRolesQuery();
  const [emailLocal, setEmailLocal] = useState("");
  const [emailDomain, setEmailDomain] = useState("naver.com");
  const [phone1, setPhone1] = useState("010");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");

  // 모달 열릴 때만 초기화
  useEffect(() => {
    if (!open) return;

    setForm({
      memberSeq: seed.memberSeq,
      memberId: seed.memberId ?? "",
      memberName: seed.memberName ?? "",
      nickname: seed.nickname ?? "",
      memberPwd: "",
      birthYmd: toDateInputValue(seed.birthYmd),
      gender: seed.gender ?? "M",
      phone: seed.phone ?? "",
      email: seed.email ?? "",
      profileImageUrl: seed.profileImageUrl ?? null,
      profileImageFileSeq: seed.profileImageFileSeq ?? null,
      region: seed.region ?? "",
      status: seed.status ?? "ACTIVE",
      roleCode: seed.roleCode ?? "",
      roleName: seed.roleName ?? "",
      lastLoginAt: seed.lastLoginAt ?? "",
      streamerProfile: {
        ...emptyStreamerProfile(),
        ...seed.streamerProfile,
      },
    });

    if (seed.email) {
      const [local, domain] = seed.email.split("@");
      setEmailLocal(local ?? "");
      setEmailDomain(domain ?? "naver.com");
    } else {
      setEmailLocal("");
      setEmailDomain("naver.com");
    }

    if (seed.phone) {
      const [p1, p2, p3] = seed.phone.split("-");
      setPhone1(p1 || "010");
      setPhone2(p2 || "");
      setPhone3(p3 || "");
    } else {
      setPhone1("010");
      setPhone2("");
      setPhone3("");
    }
  }, [open]);

  if (!open) return null;

  const update = <K extends keyof Member>(key: K, value: Member[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateStreamer = <K extends keyof MemberStreamerProfileFields>(
    key: K,
    value: MemberStreamerProfileFields[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      streamerProfile: {
        ...emptyStreamerProfile(),
        ...prev.streamerProfile,
        [key]: value,
      },
    }));
  };

  const joinEmail = (local: string, domain: string) => {
    const l = local.trim();
    const d = domain.trim();
    if (!l || !d) return "";
    return `${l}@${d}`;
  };

  const joinPhone = (p1: string, p2: string, p3: string) => {
    const a = p1.trim();
    const b = p2.trim();
    const c = p3.trim();
    if (!b && !c) return "";
    return `${a}-${b}-${c}`;
  };

  const handleSave = async () => {
    if (!form.memberId.trim()) {
      alert("아이디는 필수입니다.");
      return;
    }

    if (!form.memberName.trim()) {
      alert("성명은 필수입니다.");
      return;
    }

    if (mode === "create" && !(form.memberPwd ?? "").trim()) {
      alert("비밀번호는 필수입니다.");
      return;
    }

    if (!(form.roleCode ?? "").trim()) {
      alert("회원 권한은 필수입니다.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        ...form,
        phone: joinPhone(phone1, phone2, phone3),
        email: joinEmail(emailLocal, emailDomain),
        birthYmd: toApiBirthYmd(form.birthYmd),
        memberPwd: mode === "edit" && !(form.memberPwd ?? "").trim() ? undefined : form.memberPwd,
        streamerProfile: {
          ...emptyStreamerProfile(),
          ...form.streamerProfile,
        },
      });

      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className={styles.backdrop} onMouseDown={onClose}>
        <div
            className={styles.modal}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
        >
          <div className={styles.header}>
            <div className={styles.title}>{title}</div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">
              ✕
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.grid}>
              <div className={styles.field}>
                <div className={styles.label}>아이디 *</div>
                <input
                    className={styles.input}
                    value={form.memberId}
                    onChange={(e) => update("memberId", e.target.value)}
                    disabled={mode === "edit"}
                    placeholder="예) user0001"
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>성명 *</div>
                <input
                    className={styles.input}
                    value={form.memberName}
                    onChange={(e) => update("memberName", e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>닉네임</div>
                <input
                    className={styles.input}
                    value={form.nickname ?? ""}
                    onChange={(e) => update("nickname", e.target.value)}
                    placeholder="게시글·댓글에 표시"
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>
                  비밀번호 {mode === "create" ? "*" : ""}
                </div>
                <input
                    className={styles.input}
                    type="password"
                    value={form.memberPwd ?? ""}
                    onChange={(e) => update("memberPwd", e.target.value)}
                    placeholder={
                      mode === "create" ? "비밀번호 입력" : "변경할 때만 입력"
                    }
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>생년월일</div>
                <input
                    className={styles.input}
                    type="date"
                    value={toDateInputValue(form.birthYmd)}
                    onChange={(e) => update("birthYmd", e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>성별</div>
                <select
                    className={styles.select}
                    value={form.gender ?? "M"}
                    onChange={(e) => update("gender", e.target.value as "M" | "F")}
                >
                  <option value="M">남</option>
                  <option value="F">여</option>
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>휴대폰 번호</div>
                <div className={styles.inline}>
                  <select
                      className={`${styles.select} ${styles.phoneSelect}`}
                      value={phone1}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPhone1(v);
                        update("phone", joinPhone(v, phone2, phone3));
                      }}
                  >
                    <option value="010">010</option>
                    <option value="011">011</option>
                    <option value="016">016</option>
                    <option value="017">017</option>
                    <option value="018">018</option>
                    <option value="019">019</option>
                  </select>

                  <span className={styles.sep}>-</span>

                  <input
                      className={`${styles.input} ${styles.phoneInput}`}
                      value={phone2}
                      maxLength={4}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setPhone2(v);
                        update("phone", joinPhone(phone1, v, phone3));
                      }}
                  />

                  <span className={styles.sep}>-</span>

                  <input
                      className={`${styles.input} ${styles.phoneInput}`}
                      value={phone3}
                      maxLength={4}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setPhone3(v);
                        update("phone", joinPhone(phone1, phone2, v));
                      }}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>이메일</div>
                <div className={styles.inline}>
                  <input
                      className={`${styles.input} ${styles.smallInput}`}
                      value={emailLocal}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEmailLocal(v);
                        update("email", joinEmail(v, emailDomain));
                      }}
                      placeholder="user"
                  />

                  <span className={styles.sep}>@</span>

                  <select
                      className={`${styles.select} ${styles.smallSelect}`}
                      value={emailDomain}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEmailDomain(v);
                        update("email", joinEmail(emailLocal, v));
                      }}
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
                    value={form.roleCode ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      update("roleCode", value);
                    }}
                    disabled={rolesLoading}
                >
                  <option value="">
                    {rolesLoading ? "불러오는 중..." : "선택하세요"}
                  </option>

                  {roleOptions.map((r: any) => {
                    const roleId =
                      r.roleId ?? r.id ?? r.role_seq ?? r.role_seq_no ?? r.role_no;
                    const roleCode =
                      r.roleCode ??
                      r.role_code ??
                      r.code ??
                      r.roleId?.toString() ??
                      r.id?.toString() ??
                      "";
                    const roleName =
                      r.roleName ?? r.role_name ?? r.name ?? r.roleCode ?? roleCode;

                    return (
                        <option key={roleId ?? roleCode} value={roleCode}>
                          {roleName}
                        </option>
                    );
                  })}
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>회원 상태</div>
                <select
                    className={styles.select}
                    value={form.status ?? "ACTIVE"}
                    onChange={(e) =>
                        update(
                            "status",
                            e.target.value as "ACTIVE" | "SUSPENDED" | "WITHDRAWN"
                        )
                    }
                >
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
                    value={form.streamerProfile?.instagramUrl ?? ""}
                    onChange={(e) => updateStreamer("instagramUrl", e.target.value)}
                    placeholder="https://"
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>유튜브 URL</div>
                <input
                    className={styles.input}
                    value={form.streamerProfile?.youtubeUrl ?? ""}
                    onChange={(e) => updateStreamer("youtubeUrl", e.target.value)}
                    placeholder="https://"
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>SOOP 방송국 URL</div>
                <input
                    className={styles.input}
                    value={form.streamerProfile?.soopChannelUrl ?? ""}
                    onChange={(e) => updateStreamer("soopChannelUrl", e.target.value)}
                    placeholder="https://"
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>컴퍼니 카테고리 코드</div>
                <input
                    className={styles.input}
                    value={form.streamerProfile?.companyCategoryCode ?? ""}
                    onChange={(e) => updateStreamer("companyCategoryCode", e.target.value)}
                    placeholder="공통코드 code_value"
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>혈액형</div>
                <input
                    className={styles.input}
                    value={form.streamerProfile?.bloodType ?? ""}
                    onChange={(e) => updateStreamer("bloodType", e.target.value)}
                    placeholder="예) A"
                    maxLength={10}
                />
              </div>

              <div className={`${styles.field} ${styles.row}`}>
                <div className={styles.label}>약력·이력</div>
                <textarea
                    className={styles.textarea}
                    value={form.streamerProfile?.careerHistory ?? ""}
                    onChange={(e) => updateStreamer("careerHistory", e.target.value)}
                    placeholder="방송·활동 이력 등"
                    rows={5}
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button className={styles.btn} onClick={onClose} disabled={saving}>
              취소
            </button>
            <button
                className={`${styles.btn} ${styles.primary}`}
                onClick={handleSave}
                disabled={saving}
            >
              {saving ? "저장중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
  );
}