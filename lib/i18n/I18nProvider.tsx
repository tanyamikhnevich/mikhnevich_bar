"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  dirForLocale,
  interpolate,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "./config";
import { DICTIONARIES, type Dictionary } from "./dictionaries";

type I18nContextValue = {
  locale: Locale;
  /** Словарь текущего языка (прямой доступ: `t.home.title`). */
  t: Dictionary;
  /** Подстановка значений в шаблон: `fmt(t.home.subtitle, { bottles, value })`. */
  fmt: (template: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
  dir: "rtl" | "ltr";
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    setLocaleState(next);
    const root = document.documentElement;
    root.lang = next;
    root.dir = dirForLocale(next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: DICTIONARIES[locale],
      fmt: interpolate,
      setLocale,
      dir: dirForLocale(locale),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

export { DEFAULT_LOCALE };
