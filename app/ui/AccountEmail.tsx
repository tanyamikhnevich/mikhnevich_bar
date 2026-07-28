"use client";

import { useEffect, useState } from "react";

/** Почта текущего аккаунта — мелко, для шапки. Пусто, пока грузится или нет сессии. */
export function AccountEmail() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { email?: string } | null) => {
        if (!cancelled && data?.email) setEmail(data.email);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!email) return null;

  return (
    <span
      className="max-w-[12rem] truncate text-xs text-zinc-400"
      title={email}
    >
      {email}
    </span>
  );
}
