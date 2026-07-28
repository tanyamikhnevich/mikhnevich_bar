"use client";

import { LOCALE_LABEL, LOCALES, type Locale } from "./config";
import { useI18n } from "./I18nProvider";

/**
 * Переключатель языка EN / RU / HE. Выбор хранится в cookie и применяется сразу,
 * включая направление письма (RTL для иврита).
 */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-white p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((code: Locale) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            className={[
              "min-h-8 rounded-md px-2 text-xs font-semibold transition-colors sm:min-h-7",
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100",
            ].join(" ")}
          >
            {LOCALE_LABEL[code]}
          </button>
        );
      })}
    </div>
  );
}
