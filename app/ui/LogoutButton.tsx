"use client";

import { logout } from "../actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 active:bg-zinc-50 sm:min-h-9 sm:rounded-lg sm:px-3 sm:py-2"
      >
        Выйти
      </button>
    </form>
  );
}
