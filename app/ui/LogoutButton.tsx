"use client";

import { logout } from "../actions/auth";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function LogoutButton() {
  const { t } = useI18n();
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 active:bg-zinc-50 sm:min-h-9 sm:rounded-lg sm:px-3 sm:py-2"
      >
        {t.home.logout}
      </button>
    </form>
  );
}
