"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { Sun, Moon, LogIn, LogOut, ChevronDown, User, Users } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";
import { useAuthStore } from "@/stores/authStore";
import { bumpWalletRefresh, useWalletRefreshStore } from "@/stores/walletRefreshStore";
import { fetchMyWallet } from "@/features/members/walletApi";
import { fetchVisitorOverview, sendVisitorHeartbeat, type VisitorOverview } from "@/features/analytics/api";
import VisitorStatsModal from "@/components/analytics/VisitorStatsModal";

// 1 = 윈도우 팝업, 2 = 모달 팝업
const LOGIN_MODE: 1 | 2 = 2;

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { user, logout, restoreSession, setOAuthUser, markOAuthSpringDone, oauthSpringPending } = useAuthStore();
  const walletRefreshTick = useWalletRefreshStore((s) => s.tick);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [myMenuOpen, setMyMenuOpen] = useState(false);
  const [walletPoints, setWalletPoints] = useState<number | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState<VisitorOverview | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /** NextAuth(OAuth) 세션이 있으면 여기서는 Spring 복원하지 않음 — 아래 effect 가 spring-sync 후 restore */
  useEffect(() => {
    if (session?.user?.memberId) return;
    void restoreSession();
  }, [restoreSession, session?.user?.memberId]);

  /** OAuth: spring-sync 먼저 → JSESSIONID 확보 후 restore + 지갑 API 재시도 */
  useEffect(() => {
    const mid = session?.user?.memberId;
    const mseq = session?.user?.memberSeq;
    if (!mid || mseq == null) return;

    setOAuthUser({
      username: mid,
      memberSeq: mseq,
      nickname: session.user?.name ?? undefined,
      profileImageUrl: session.user?.image ?? undefined,
    });

    let cancelled = false;
    void (async () => {
      try {
        const sync = await fetch("/api/auth/spring-sync", { method: "POST", credentials: "include" });
        if (!cancelled && sync.ok) {
          await restoreSession();
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) {
          markOAuthSpringDone();
          bumpWalletRefresh();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    session?.user?.memberId,
    session?.user?.memberSeq,
    session?.user?.name,
    session?.user?.image,
    setOAuthUser,
    restoreSession,
    markOAuthSpringDone,
  ]);

  useEffect(() => {
    const onClickOutside = () => setMyMenuOpen(false);
    if (!myMenuOpen) return;
    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, [myMenuOpen]);

  const displayName =
    user?.nickname?.trim() ||
    user?.username ||
    (session?.user?.name || session?.user?.email) ||
    null;

  const isLoggedIn = Boolean(user) || Boolean(session);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      setWalletPoints(null);
      return;
    }
    if (oauthSpringPending) return;
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
  }, [isLoggedIn, user, oauthSpringPending, walletRefreshTick]);

  useEffect(() => {
    let cancelled = false;
    const beat = async () => {
      try {
        await sendVisitorHeartbeat();
      } catch {
        // heartbeat 실패는 UI 흐름을 막지 않음
      }
    };
    const refreshOnline = async () => {
      try {
        const data = await fetchVisitorOverview({ days: 7, weeks: 4, months: 3 });
        if (!cancelled) {
          setOnlineCount(data.onlineCount ?? 0);
          setStats((prev) => prev ?? data);
        }
      } catch {
        if (!cancelled) setOnlineCount(0);
      }
    };

    void beat();
    void refreshOnline();
    const heartbeatTimer = window.setInterval(() => {
      void beat();
      void refreshOnline();
    }, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(heartbeatTimer);
    };
  }, []);

  const openStatsModal = async () => {
    setStatsOpen(true);
    setStatsError(null);
    setStatsLoading(true);
    try {
      const data = await fetchVisitorOverview({ days: 30, weeks: 12, months: 12 });
      setOnlineCount(data.onlineCount ?? 0);
      setStats(data);
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : "방문자 통계를 불러오지 못했습니다.");
    } finally {
      setStatsLoading(false);
    }
  };

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
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm hover:bg-muted"
            onClick={openStatsModal}
            type="button"
            aria-label="현재 접속자 통계"
            title="현재 접속자 통계"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">현재접속자</span>
            <span className="font-semibold text-emerald-500 dark:text-emerald-400">{onlineCount}</span>
          </button>

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
                    className="absolute right-0 z-50 mt-2 w-52 min-w-[11rem] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:shadow-slate-950/40"
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {walletPoints != null ? (
                      <div className="border-b border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        보유 포인트{" "}
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {walletPoints.toLocaleString("ko-KR")}P
                        </span>
                      </div>
                    ) : null}
                    <Link
                      href="/myInfo"
                      className="block px-4 py-2 text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setMyMenuOpen(false)}
                    >
                      내 회원정보
                    </Link>
                    <button
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
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
      <VisitorStatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        data={stats}
        loading={statsLoading}
        error={statsError}
      />
    </header>
  );
}