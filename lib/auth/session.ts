import { cookies, headers } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./token";

/** Управление cookie сессии. Работает в серверных экшенах и route handlers. */

export async function createSession(user: {
  id: string;
  email: string;
}): Promise<void> {
  const token = signSessionToken({ userId: user.id, email: user.email });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Текущая сессия (или null). Только проверка подписи токена, без запроса в БД.
 * Источник токена: cookie `session` (веб-сайт) или заголовок
 * `Authorization: Bearer <token>` (нативное приложение).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const fromCookie = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (fromCookie) return fromCookie;

  const authz = (await headers()).get("authorization");
  if (authz?.startsWith("Bearer ")) {
    return verifySessionToken(authz.slice("Bearer ".length).trim());
  }
  return null;
}
