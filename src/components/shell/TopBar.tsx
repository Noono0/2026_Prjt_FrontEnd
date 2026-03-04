"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { Sun, Moon, LogIn, LogOut } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";
import { useAuthStore } from "@/stores/authStore";

// 1 = 윈도우 팝업, 2 = 모달 팝업
const LOGIN_MODE: 1 | 2 = 2;

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName =
    user?.username ??
    (session?.user?.name || session?.user?.email) ??
    null;

  const isLoggedIn = Boolean(user) || Boolean(session);

  const onLogout = async () => {
    if (user) logout();
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
              <div className="hidden text-sm text-muted-foreground md:block">
                {displayName ? `안녕하세요, ${displayName}` : "로그인됨"}
              </div>
              <button
                className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
                onClick={onLogout}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> 로그아웃
                </span>
              </button>
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