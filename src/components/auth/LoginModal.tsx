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
                  className="w-full rounded-xl border border-gray-500 bg-gray-700 px-4 py-3 text-sm text-white hover:bg-gray-600"
                  onClick={() => signIn("google")}
                  type="button"
                  disabled={!socialEnabled.google}
                >
                  Google로 계속하기
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
                  className="w-full rounded-xl border border-gray-500 bg-gray-700 px-4 py-3 text-sm text-white hover:bg-gray-600"
                  onClick={() => signIn("naver")}
                  type="button"
                  disabled={!socialEnabled.naver}
                >
                  Naver로 계속하기
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
