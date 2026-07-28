export const LOCALES = ["en", "ru", "he"] as const;
export type Locale = (typeof LOCALES)[number];

/** По умолчанию — английский (весь контент из БД тоже на английском). */
export const DEFAULT_LOCALE: Locale = "en";

/** Языки с письмом справа налево. */
const RTL_LOCALES: readonly Locale[] = ["he"];

/** Cookie, в которой хранится выбранный язык (читается и сервером, и клиентом). */
export const LOCALE_COOKIE = "locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 год

/** Короткая подпись для переключателя языка. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
  he: "HE",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

export function dirForLocale(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

/**
 * Подставляет значения в шаблон вида `"...{name}..."`.
 * Ключи, для которых нет значения, остаются как есть.
 */
export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
