"use client";

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getProviders, signIn } from "next-auth/react";
import { useAuthStore } from "@/stores/authStore";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** 네이버 로그인 버튼용 마크 (흰 배경 + 브랜드 녹색 N / #03C75A) */
function NaverMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5" fill="#fff" />
      <path
        fill="#03C75A"
        d="M7 7h2.55v4.35L14.45 7H17v10h-2.55v-4.4L9.55 17H7V7z"
      />
    </svg>
  );
}

/** 구글 브랜드 색상 G 마크 (이미지 파일 불필요) */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type PwFlow = "login" | "pw-request" | "pw-code" | "pw-new";

export default function LoginModal({ open, onClose }: Props) {
  const { login } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberId, setRememberId] = useState(false);
  const [socialEnabled, setSocialEnabled] = useState<Record<string, boolean>>({
    google: false,
    kakao: false,
    naver: false,
  });

  const [pwFlow, setPwFlow] = useState<PwFlow>("login");
  const [pwMemberId, setPwMemberId] = useState("");
  const [pwEmail, setPwEmail] = useState("");
  const [pwCode, setPwCode] = useState("");
  const [pwResetToken, setPwResetToken] = useState<string | null>(null);
  const [pwNew, setPwNew] = useState("");
  const [pwNew2, setPwNew2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => username.trim() && password.trim(), [username, password]);

  React.useEffect(() => {
    if (!open) return;

    const cookies = document.cookie.split(";").map((c) => c.trim());
    const saved = cookies.find((c) => c.startsWith("savedMemberId="));
    if (saved) {
      const value = decodeURIComponent(saved.split("=")[1] ?? "");
      setUsername(value);
      setRememberId(Boolean(value));
    } else {
      setRememberId(false);
    }

    setPwFlow("login");
    setPwMemberId("");
    setPwEmail("");
    setPwCode("");
    setPwResetToken(null);
    setPwNew("");
    setPwNew2("");
    setPwMsg(null);
    setPwErr(null);

    const loadProviders = async () => {
      try {
        const providers = await getProviders();
        setSocialEnabled({
          google: Boolean(providers?.google),
          kakao: Boolean(providers?.kakao),
          naver: Boolean(providers?.naver),
        });
      } catch {
        setSocialEnabled({ google: false, kakao: false, naver: false });
      }
    };
    void loadProviders();
  }, [open]);

  if (!open) return null;

  const onCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setLoginError(null);
    try {
      const ok = await login(username, password);
      if (ok) {
        if (rememberId) {
          document.cookie = `savedMemberId=${encodeURIComponent(username)}; Max-Age=86400; Path=/; SameSite=Lax`;
        } else {
          document.cookie = "savedMemberId=; Max-Age=0; Path=/; SameSite=Lax";
        }
        onClose();
      } else {
        setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onPwRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwMemberId.trim() || !pwEmail.trim()) {
      setPwErr("아이디와 가입 이메일을 입력해 주세요.");
      return;
    }
    setPwBusy(true);
    setPwErr(null);
    setPwMsg(null);
    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: pwMemberId.trim(), email: pwEmail.trim() }),
      });
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? "요청에 실패했습니다.");
      }
      setPwMsg(json.message ?? "이메일을 확인해 주세요. (네이버·카카오·Gmail 등 수신 도메인 무관)");
      setPwFlow("pw-code");
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : "요청에 실패했습니다.");
    } finally {
      setPwBusy(false);
    }
  };

  const onPwVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = pwCode.replace(/\D/g, "").slice(0, 6);
    if (c.length !== 6) {
      setPwErr("인증코드 6자리를 입력해 주세요.");
      return;
    }
    setPwBusy(true);
    setPwErr(null);
    setPwMsg(null);
    try {
      const res = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: pwMemberId.trim(),
          email: pwEmail.trim(),
          code: c,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: { resetToken?: string };
      };
      if (!res.ok || !json.success || !json.data?.resetToken) {
        throw new Error(json.message ?? "인증에 실패했습니다.");
      }
      setPwResetToken(json.data.resetToken);
      setPwMsg(json.message ?? "새 비밀번호를 입력해 주세요.");
      setPwFlow("pw-new");
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : "인증에 실패했습니다.");
    } finally {
      setPwBusy(false);
    }
  };

  const onPwComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwResetToken) {
      setPwErr("재설정 토큰이 없습니다. 처음부터 다시 시도해 주세요.");
      return;
    }
    if (pwNew.length < 8) {
      setPwErr("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (pwNew !== pwNew2) {
      setPwErr("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    setPwBusy(true);
    setPwErr(null);
    setPwMsg(null);
    try {
      const res = await fetch("/api/auth/password-reset/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: pwResetToken, newPassword: pwNew }),
      });
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? "비밀번호 변경에 실패했습니다.");
      }
      alert(json.message ?? "비밀번호가 변경되었습니다. 로그인해 주세요.");
      setPwFlow("login");
      setPassword("");
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setPwBusy(false);
    }
  };

  const backToLogin = () => {
    setPwFlow("login");
    setPwErr(null);
    setPwMsg(null);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-500 bg-gray-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-600 px-5 py-4">
          <div className="text-lg font-semibold text-white">
            {pwFlow === "login" ? "로그인" : "비밀번호 찾기"}
          </div>
          <button
            className="rounded-lg p-2 text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={onClose}
            aria-label="close"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-5 pt-4 pb-5">
          {pwFlow === "login" && (
            <>
              <div className="space-y-2">
                <button
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-500 bg-gray-700 px-4 py-3 text-sm text-white hover:bg-gray-600 disabled:opacity-50"
                  onClick={() => signIn("google")}
                  type="button"
                  disabled={!socialEnabled.google}
                  aria-label="Google로 로그인"
                >
                  <GoogleMark className="h-5 w-5 shrink-0" />
                  <span>Google로 계속하기</span>
                </button>
                <button
                  className="w-full rounded-xl border border-gray-500 bg-gray-700 px-4 py-3 text-sm text-white hover:bg-gray-600"
                  onClick={() => signIn("kakao")}
                  type="button"
                  disabled={!socialEnabled.kakao}
                >
                  Kakao로 계속하기
                </button>
                <button
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#03C75A] bg-[#03C75A] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
                  onClick={() => signIn("naver")}
                  type="button"
                  disabled={!socialEnabled.naver}
                  aria-label="네이버로 로그인"
                >
                  <NaverMark className="h-6 w-6 shrink-0 rounded" />
                  <span>네이버로 계속하기</span>
                </button>

                <div className="pt-1 text-xs text-gray-400">
                  * 소셜 로그인 세션은 NextAuth가 관리합니다. 백엔드(Spring) API JWT 연동은 다음 단계에서 토큰 교환 로직을 붙이면 됩니다.
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <div className="h-px flex-1 bg-gray-600" />
                <span>또는</span>
                <div className="h-px flex-1 bg-gray-600" />
              </div>

              <form onSubmit={onCredentialLogin} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-200">아이디</label>
                  <input
                    className="w-full rounded-xl border border-gray-500 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-200">비밀번호</label>
                  <input
                    className="w-full rounded-xl border border-gray-500 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin1234"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-sky-400 hover:underline"
                    onClick={() => {
                      setPwFlow("pw-request");
                      setPwMemberId(username.trim());
                      setPwErr(null);
                      setPwMsg(null);
                    }}
                  >
                    비밀번호 찾기
                  </button>
                </div>

                <div className="text-xs text-gray-400">* ID/PW 로그인은 백엔드(세션) 기반입니다.</div>
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={rememberId}
                    onChange={(e) => setRememberId(e.target.checked)}
                  />
                  아이디 저장 (쿠키 1일)
                </label>
                {loginError && <div className="text-xs text-rose-300">{loginError}</div>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-gray-500 bg-gray-600 px-4 py-3 text-sm font-medium text-white hover:bg-gray-500"
                  >
                    닫기
                  </button>
                  <button
                    disabled={!canSubmit}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600"
                    type="submit"
                  >
                    {loading ? "로그인 중..." : "로그인"}
                  </button>
                </div>
              </form>
            </>
          )}

          {pwFlow === "pw-request" && (
            <form onSubmit={onPwRequest} className="space-y-3">
              <p className="text-xs text-gray-400">
                가입 시 등록한 이메일 주소로 6자리 인증코드를 보냅니다. 수신 메일함은 네이버·카카오·Gmail 등 어디든 가능합니다.
              </p>
              {pwErr && <div className="text-xs text-rose-300">{pwErr}</div>}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-200">아이디</label>
                <input
                  className="w-full rounded-xl border border-gray-500 bg-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={pwMemberId}
                  onChange={(e) => setPwMemberId(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-200">가입 이메일</label>
                <input
                  className="w-full rounded-xl border border-gray-500 bg-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  type="email"
                  autoComplete="email"
                  value={pwEmail}
                  onChange={(e) => setPwEmail(e.target.value)}
                  placeholder="example@naver.com"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={backToLogin}
                  className="flex-1 rounded-xl border border-gray-500 bg-gray-600 px-4 py-3 text-sm text-white hover:bg-gray-500"
                >
                  로그인으로
                </button>
                <button
                  type="submit"
                  disabled={pwBusy}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {pwBusy ? "전송 중..." : "인증코드 보내기"}
                </button>
              </div>
            </form>
          )}

          {pwFlow === "pw-code" && (
            <form onSubmit={onPwVerify} className="space-y-3">
              {pwMsg && <div className="text-xs text-emerald-300">{pwMsg}</div>}
              {pwErr && <div className="text-xs text-rose-300">{pwErr}</div>}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-200">이메일로 받은 6자리 코드</label>
                <input
                  className="w-full rounded-xl border border-gray-500 bg-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  inputMode="numeric"
                  maxLength={6}
                  value={pwCode}
                  onChange={(e) => setPwCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwFlow("pw-request")}
                  className="flex-1 rounded-xl border border-gray-500 bg-gray-600 px-4 py-3 text-sm text-white hover:bg-gray-500"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={pwBusy}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {pwBusy ? "확인 중..." : "확인"}
                </button>
              </div>
            </form>
          )}

          {pwFlow === "pw-new" && (
            <form onSubmit={onPwComplete} className="space-y-3">
              {pwMsg && <div className="text-xs text-emerald-300">{pwMsg}</div>}
              {pwErr && <div className="text-xs text-rose-300">{pwErr}</div>}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-200">새 비밀번호 (8자 이상)</label>
                <input
                  className="w-full rounded-xl border border-gray-500 bg-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  type="password"
                  autoComplete="new-password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-200">새 비밀번호 확인</label>
                <input
                  className="w-full rounded-xl border border-gray-500 bg-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  type="password"
                  autoComplete="new-password"
                  value={pwNew2}
                  onChange={(e) => setPwNew2(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwFlow("pw-code")}
                  className="flex-1 rounded-xl border border-gray-500 bg-gray-600 px-4 py-3 text-sm text-white hover:bg-gray-500"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={pwBusy}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {pwBusy ? "저장 중..." : "비밀번호 변경"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
