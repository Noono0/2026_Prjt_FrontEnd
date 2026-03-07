"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./MemberFormModal.module.css";
import { useRolesQuery } from "@/features/members/queries";

export type Member = {
  id: string; // 아이디
  name: string; // 사용자성명
  birthYmd?: string; // YYYY-MM-DD
  gender?: "M" | "F";
  phone?: string;
  email?: string;
  region?: string;
  status?: "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
  role?: string; // 회원 권한
  lastLoginAt?: string;
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
  // assume already yyyy-mm-dd
  return birthYmd;
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
          id: "",
          name: "",
          birthYmd: "",
          gender: "M",
          phone: "",
          email: "",
          status: "ACTIVE",
          role: "",
        }
    );
  }, [initial]);

  const [form, setForm] = useState<Member>(seed);
  const [saving, setSaving] = useState(false);

  const { data: roleOptions = [], isLoading: rolesLoading } = useRolesQuery();

  // 이메일/휴대폰을 UI 용으로 쪼갠 상태
  const [emailLocal, setEmailLocal] = useState("");
  const [emailDomain, setEmailDomain] = useState("naver.com");
  const [phone1, setPhone1] = useState("010");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(seed);
    // 이메일 쪼개기
    if (seed.email) {
      const [local, domain] = seed.email.split("@");
      setEmailLocal(local ?? "");
      setEmailDomain(domain ?? "naver.com");
    } else {
      setEmailLocal("");
      setEmailDomain("naver.com");
    }
    // 휴대폰 쪼개기
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
  }, [open, seed]);

  if (!open) return null;

  const update = <K extends keyof Member>(key: K, value: Member[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const joinEmail = (local: string, domain: string) =>
      local.trim() && domain.trim() ? `${local.trim()}@${domain.trim()}` : "";

  const joinPhone = (p1: string, p2: string, p3: string) =>
      p2.trim() || p3.trim() ? `${p1.trim()}-${p2.trim()}-${p3.trim()}` : "";

  const handleSave = async () => {
    if (!form.id.trim()) {
      alert("아이디는 필수입니다.");
      return;
    }
    if (!form.name.trim()) {
      alert("성명은 필수입니다.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        ...form,
        phone: joinPhone(phone1, phone2, phone3),
        email: joinEmail(emailLocal, emailDomain),
        birthYmd: form.birthYmd ? toDateInputValue(form.birthYmd) : "",
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className={styles.backdrop} onMouseDown={onClose}>
        <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
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
                    value={form.id}
                    onChange={(e) => update("id", e.target.value)}
                    disabled={mode === "edit"}
                    placeholder="예) user0001"
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>성명 *</div>
                <input
                    className={styles.input}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
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
                    <option value="018">018</option>
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
                    <option value="google.com">google.com</option>
                    <option value="naver.com">naver.com</option>
                    <option value="kakao.com">kakao.com</option>
                    <option value="gmail.com">gmail.com</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>회원 권한</div>
                <select
                    className={styles.select}
                    value={form.role ?? ""}
                    onChange={(e) => update("role", e.target.value || undefined)}
                    disabled={rolesLoading}
                >
                  <option value="">
                    {rolesLoading ? "불러오는 중..." : "선택하세요"}
                  </option>
                  {roleOptions.map((r) => (
                      <option key={r.id} value={r.role_name}>
                        {r.role_name}
                      </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <div className={styles.label}>회원 상태</div>
                <select
                    className={styles.select}
                    value={form.status ?? "ACTIVE"}
                    onChange={(e) =>
                        update("status", e.target.value as "ACTIVE" | "SUSPENDED" | "WITHDRAWN")
                    }
                >
                  <option value="ACTIVE">정상</option>
                  <option value="SUSPENDED">정지</option>
                  <option value="WITHDRAWN">탈퇴</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button className={styles.btn} onClick={onClose} disabled={saving}>
              취소
            </button>
            <button className={`${styles.btn} ${styles.primary}`} onClick={handleSave} disabled={saving}>
              {saving ? "저장중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
  );
}