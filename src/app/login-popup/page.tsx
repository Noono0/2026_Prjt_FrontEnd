"use client";

import LoginModal from "@/components/auth/LoginModal";

export default function LoginPopupPage() {
  return <LoginModal open onClose={() => window.close()} />;
}

