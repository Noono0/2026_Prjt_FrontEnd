"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;

  return (
    <button
      className="rounded-lg border px-3 py-1 text-sm"
      style={{ borderColor: "rgb(var(--border))" }}
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      title="다크/라이트 전환"
    >
      {current === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
