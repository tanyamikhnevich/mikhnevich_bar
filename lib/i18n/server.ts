import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { DICTIONARIES, type Dictionary } from "./dictionaries";

/** Текущий язык из cookie (для серверных компонентов, экшенов и route handlers). */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Словарь текущего языка на сервере. */
export async function getServerDictionary(): Promise<Dictionary> {
  return DICTIONARIES[await getServerLocale()];
}
