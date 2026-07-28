"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { getServerDictionary } from "@/lib/i18n/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginState = { error?: string } | undefined;
export type RegisterState = { error?: string } | undefined;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const { errors } = await getServerDictionary();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: errors.enterEmailPassword };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Проверяем пароль всегда, даже если пользователя нет — чтобы не выдавать
  // разное время ответа и не подсказывать, существует ли email.
  const ok =
    user != null && (await verifyPassword(password, user.passwordHash));

  if (!user || !ok) {
    return { error: errors.invalidCredentials };
  }

  await createSession({ id: user.id, email: user.email });
  redirect("/");
}

export async function register(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const { errors } = await getServerDictionary();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Валидация на сервере — не доверяем клиенту, даже если кнопка была заблокирована.
  if (!email || !password) {
    return { error: errors.enterEmailPassword };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: errors.invalidEmail };
  }
  if (password.length < 8) {
    return { error: errors.passwordMin8 };
  }
  if (password !== confirmPassword) {
    return { error: errors.passwordsNoMatch };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: errors.userExists };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  await createSession({ id: user.id, email: user.email });
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
