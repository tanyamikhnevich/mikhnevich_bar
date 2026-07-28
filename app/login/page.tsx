"use client";

import { useActionState, useState } from "react";
import {
  login,
  register,
  type LoginState,
  type RegisterState,
} from "../actions/auth";
import { useI18n } from "@/lib/i18n/I18nProvider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_CLASS =
  "min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 pr-16 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200";
const LABEL_CLASS = "mb-1 block text-sm font-medium text-zinc-700";

/** Поле пароля с кнопкой «Показать/Скрыть». */
function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={FIELD_CLASS}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-zinc-500 hover:text-zinc-800"
          aria-label={show ? t.login.hidePassword : t.login.showPassword}
        >
          {show ? t.login.hide : t.login.show}
        </button>
      </div>
    </div>
  );
}

function LoginForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="login-email" className={LABEL_CLASS}>
          {t.login.email}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <PasswordField
        id="login-password"
        name="password"
        label={t.login.password}
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />

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
        {pending ? t.login.loginPending : t.login.loginSubmit}
      </button>
    </form>
  );
}

function RegisterForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    register,
    undefined,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordLongEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    emailValid && passwordLongEnough && passwordsMatch && !pending;

  // Живые подсказки — показываем, только когда поле уже заполнено.
  const emailHint = email.length > 0 && !emailValid ? t.login.hintInvalidEmail : null;
  const passwordHint =
    password.length > 0 && !passwordLongEnough ? t.login.hintMin8 : null;
  const confirmHint =
    confirmPassword.length > 0 && !passwordsMatch ? t.login.hintNoMatch : null;

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="register-email" className={LABEL_CLASS}>
          {t.login.email}
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD_CLASS}
        />
        {emailHint ? (
          <p className="mt-1 text-xs text-red-600">{emailHint}</p>
        ) : null}
      </div>

      <div>
        <PasswordField
          id="register-password"
          name="password"
          label={t.login.password}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        {passwordHint ? (
          <p className="mt-1 text-xs text-red-600">{passwordHint}</p>
        ) : null}
      </div>

      <div>
        <PasswordField
          id="register-confirm"
          name="confirmPassword"
          label={t.login.confirmPassword}
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
        {confirmHint ? (
          <p className="mt-1 text-xs text-red-600">{confirmHint}</p>
        ) : null}
      </div>

      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="min-h-11 w-full rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white active:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t.login.registerPending : t.login.registerSubmit}
      </button>
    </form>
  );
}

export default function AuthPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"login" | "register">("login");

  const tabClass = (active: boolean) =>
    `min-h-10 flex-1 rounded-lg px-3 text-sm font-medium transition ${
      active
        ? "bg-white text-zinc-900 shadow-sm"
        : "text-zinc-600 hover:text-zinc-900"
    }`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-900">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div aria-hidden className="text-4xl">
            🍷
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            {t.login.appTitle}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {mode === "login"
              ? t.login.loginSubtitle
              : t.login.registerSubtitle}
          </p>
        </div>

        <div className="mb-4 flex gap-1 rounded-xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={tabClass(mode === "login")}
          >
            {t.login.tabLogin}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={tabClass(mode === "register")}
          >
            {t.login.tabRegister}
          </button>
        </div>

        {mode === "login" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}
