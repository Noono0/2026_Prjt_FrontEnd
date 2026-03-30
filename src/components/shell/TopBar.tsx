"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { Sun, Moon, LogIn, LogOut, ChevronDown, User } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";
import { useAuthStore } from "@/stores/authStore";
import { useWalletRefreshStore } from "@/stores/walletRefreshStore";
import { fetchMyWallet } from "@/features/members/walletApi";

// 1 = 윈도우 팝업, 2 = 모달 팝업
const LOGIN_MODE: 1 | 2 = 2;

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { user, logout, restoreSession } = useAuthStore();
  const walletRefreshTick = useWalletRefreshStore((s) => s.tick);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [myMenuOpen, setMyMenuOpen] = useState(false);
  const [walletPoints, setWalletPoints] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const onClickOutside = () => setMyMenuOpen(false);
    if (!myMenuOpen) return;
    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, [myMenuOpen]);

  const displayName =
    user?.nickname?.trim() ||
    user?.memberName?.trim() ||
    user?.username ||
    (session?.user?.name || session?.user?.email) ||
    null;

  const isLoggedIn = Boolean(user) || Boolean(session);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      setWalletPoints(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const w = await fetchMyWallet();
        if (!cancelled) setWalletPoints(w.pointBalance ?? 0);
      } catch {
        if (!cancelled) setWalletPoints(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user, walletRefreshTick]);

  const onLogout = async () => {
    if (user) await logout();
    if (session) await signOut({ callbackUrl: "/" });
  };

  const onLoginClick = () => {
    if (LOGIN_MODE === 1) {
      window.open(
        "/login-popup",
        "loginPopup",
        "width=480,height=640,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
      );
      return;
    }

    // 기본: 모달 팝업
    setOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="text-sm font-semibold">PRJT Admin</div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            type="button"
            aria-label="toggle theme"
            title="Theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {isLoggedIn ? (
            <>
              <div className="relative">
                <button
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-muted"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMyMenuOpen((prev) => !prev);
                  }}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden text-muted-foreground md:inline">
                    {displayName ? `안녕하세요, ${displayName}` : "로그인됨"}
                    {walletPoints != null ? (
                      <span className="ml-2 text-sky-600 dark:text-sky-400">
                        · {walletPoints.toLocaleString("ko-KR")}P
                      </span>
                    ) : null}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {myMenuOpen && (
                  <div
                    className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border bg-background shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {walletPoints != null ? (
                      <div className="border-b px-4 py-2 text-xs text-muted-foreground">
                        보유 포인트{" "}
                        <span className="font-semibold text-foreground">{walletPoints.toLocaleString("ko-KR")}P</span>
                      </div>
                    ) : null}
                    <Link
                      href="/myInfo"
                      className="block px-4 py-2 text-sm hover:bg-muted"
                      onClick={() => setMyMenuOpen(false)}
                    >
                      내 회원정보
                    </Link>
                    <button
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
                      onClick={async () => {
                        setMyMenuOpen(false);
                        await onLogout();
                      }}
                      type="button"
                    >
                      <LogOut className="h-4 w-4" /> 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              onClick={onLoginClick}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Login
              </span>
            </button>
          )}
        </div>
      </div>

      <LoginModal open={open} onClose={() => setOpen(false)} />
    </header>
  );
}