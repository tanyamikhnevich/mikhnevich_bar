import crypto from "node:crypto";

/**
 * Хеширование пароля на встроенном scrypt (без внешних зависимостей).
 * Хранимый формат: `<saltHex>:<hashHex>`.
 */

const KEY_LEN = 64;

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, KEY_LEN, (err, derived) => {
      if (err) reject(err);
      else resolve(`${salt.toString("hex")}:${derived.toString("hex")}`);
    });
  });
}

export function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const [saltHex, hashHex] = stored.split(":");
    if (!saltHex || !hashHex) return resolve(false);
    const salt = Buffer.from(saltHex, "hex");
    const hash = Buffer.from(hashHex, "hex");
    crypto.scrypt(password, salt, hash.length, (err, derived) => {
      if (err) return resolve(false);
      resolve(
        derived.length === hash.length && crypto.timingSafeEqual(derived, hash),
      );
    });
  });
}
