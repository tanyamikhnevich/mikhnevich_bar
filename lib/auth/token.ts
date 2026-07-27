import crypto from "node:crypto";

/**
 * Подпись и проверка токена сессии на встроенном node:crypto (без внешних зависимостей).
 * Формат токена: `<base64url(payload)>.<base64url(HMAC-SHA256)>` — мини-JWT.
 * Используется и в proxy.ts (Node-рантайм), и в API-роутах, и в серверных экшенах.
 */

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 дней

export type SessionPayload = {
  userId: string;
  email: string;
  exp: number; // unix-время (секунды), когда сессия истекает
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET не задан (или слишком короткий). Добавьте его в .env и в переменные окружения Vercel.",
    );
  }
  return secret;
}

export function signSessionToken(
  data: Pick<SessionPayload, "userId" | "email">,
  maxAgeSec: number = SESSION_MAX_AGE_SEC,
): string {
  const payload: SessionPayload = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + maxAgeSec,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(
  token: string | undefined | null,
): SessionPayload | null {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString(),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
