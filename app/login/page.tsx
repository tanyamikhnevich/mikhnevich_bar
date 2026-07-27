"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4 py-16 text-zinc-900">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div aria-hidden className="text-4xl">
            🍷
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Моя коллекция вин
          </h1>
          <p className="mt-1 text-sm text-zinc-600">Войдите, чтобы продолжить</p>
        </div>

        <form
          action={action}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            />
          </div>

          {state?.error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="min-h-11 w-full rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white active:bg-rose-800 disabled:opacity-60"
          >
            {pending ? "Вход…" : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
