import { NextResponse } from "next/server";
import { getSession } from "./session";
import type { SessionPayload } from "./token";

/**
 * Data Access Layer для авторизации.
 * Единая точка проверки сессии в API-роутах, чтобы не дублировать логику.
 */

/**
 * Требует авторизованную сессию в route handler.
 * Возвращает `{ session }` — если пользователь вошёл, либо
 * `{ response }` — готовый ответ 401, который нужно вернуть из хендлера.
 *
 * Использование:
 *   const auth = await requireApiSession();
 *   if ("response" in auth) return auth.response;
 *   // дальше auth.session.userId доступен
 */
export async function requireApiSession(): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json({ error: "Требуется вход" }, { status: 401 }),
    };
  }
  return { session };
}
