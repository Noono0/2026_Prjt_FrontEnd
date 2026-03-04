"use client";

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";
import { useAuthStore } from "@/stores/authStore";
import { X } from "lucide-react";


type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginModal({ open, onClose }: Props) {
  const { login } = useAuthStore();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin1234");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => username.trim() && password.trim(), [username, password]);

  if (!open) return null;

  const onCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const ok = await login(username, password);
      if (ok) onClose();
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-500 bg-gray-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-600 px-5 py-4">
          <div className="text-lg font-semibold text-white">로그인</div>
          <button
            className="rounded-lg p-2 text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={onClose}
            aria-label="close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-5 space-y-6">
          {/* 소셜 로그인 영역 */}
          <div className="space-y-2">
            <button
              className="w-full rounded-xl border border-gray-500 bg-gray-700 px-4 py-3 text-sm text-white hover:bg-gray-600"
              onClick={() => signIn("google")}
              type="button"
            >
              Google로 계속하기
            </button>
            <button
              className="w-full rounded-xl border border-gray-500 bg-gray-700 px-4 py-3 text-sm text-white hover:bg-gray-600"
              onClick={() => signIn("kakao")}
              type="button"
            >
              Kakao로 계속하기
            </button>
            <button
              className="w-full rounded-xl border border-gray-500 bg-gray-700 px-4 py-3 text-sm text-white hover:bg-gray-600"
              onClick={() => signIn("naver")}
              type="button"
            >
              Naver로 계속하기
            </button>

            <div className="pt-1 text-xs text-gray-400">
              * 소셜 로그인 세션은 NextAuth가 관리합니다. 백엔드(Spring) API JWT 연동은 다음 단계에서 토큰 교환 로직을 붙이면 됩니다.
            </div>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-gray-600" />
            <span>또는</span>
            <div className="h-px flex-1 bg-gray-600" />
          </div>

          {/* ID/PW 로그인 영역 */}
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

            <div className="text-xs text-gray-400">
              * ID/PW 로그인은 백엔드(JWT) 기반입니다.
            </div>

            {/* [닫기] [로그인] 양옆 배치 */}
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
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
