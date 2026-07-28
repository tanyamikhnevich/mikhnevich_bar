"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginState = { error?: string } | undefined;
export type RegisterState = { error?: string } | undefined;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Проверяем пароль всегда, даже если пользователя нет — чтобы не выдавать
  // разное время ответа и не подсказывать, существует ли email.
  const ok =
    user != null && (await verifyPassword(password, user.passwordHash));

  if (!user || !ok) {
    return { error: "Неверный email или пароль" };
  }

  await createSession({ id: user.id, email: user.email });
  redirect("/");
}

export async function register(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Валидация на сервере — не доверяем клиенту, даже если кнопка была заблокирована.
  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Некорректный email" };
  }
  if (password.length < 8) {
    return { error: "Пароль должен быть не короче 8 символов" };
  }
  if (password !== confirmPassword) {
    return { error: "Пароли не совпадают" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Пользователь с таким email уже существует" };
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
