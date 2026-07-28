"use client";

import { LocaleSwitcher } from "./LocaleSwitcher";

/**
 * Мини-футер с переключателем языка. Рендерится в самом низу страницы,
 * после основного контента (таблиц).
 */
export function LocaleFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white/60 py-4">
      <div className="mx-auto flex w-full max-w-[82rem] justify-center px-4">
        <LocaleSwitcher />
      </div>
    </footer>
  );
}
