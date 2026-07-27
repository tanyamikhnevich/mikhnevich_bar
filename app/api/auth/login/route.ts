import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken, SESSION_MAX_AGE_SEC } from "@/lib/auth/token";

/**
 * Логин для API-клиентов (нативное iOS-приложение).
 * Публичный: сам вход не требует токена.
 * Возвращает токен, который дальше отправляется в каждом запросе как
 *   Authorization: Bearer <token>
 */
export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Нужны email и password" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Проверяем пароль всегда — чтобы не выдавать разное время ответа и не
  // подсказывать, существует ли такой email.
  const ok =
    user != null && (await verifyPassword(password, user.passwordHash));

  if (!user || !ok) {
    return NextResponse.json(
      { error: "Неверный email или пароль" },
      { status: 401 },
    );
  }

  const token = signSessionToken({ userId: user.id, email: user.email });
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_SEC * 1000,
  ).toISOString();

  return NextResponse.json({
    token,
    tokenType: "Bearer",
    expiresAt,
    user: { id: user.id, email: user.email },
  });
}
