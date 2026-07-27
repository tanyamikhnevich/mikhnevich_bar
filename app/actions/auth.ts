"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";

export type LoginState = { error?: string } | undefined;

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

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
