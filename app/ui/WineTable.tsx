"use client";

import type { Wine } from "../../lib/wines";
import {
  displayNotes,
  displayRatings,
  formatAmountWithCurrency,
  formatDateRU,
} from "../../lib/wines";
import { countryCodeToFlagEmoji } from "../../lib/wineUtils";

const cellBase = "min-w-0 break-words align-top text-center text-zinc-800";

/** Доли ширины под `table-fixed` (сумма 100%). Колонка «Название» уже (~10% таблицы ≈ 70% от прежних min-width). */
const COL_PCT = [
  5.5, 10, 13, 3, 9, 8, 7, 6.5, 8.5, 6.5, 6, 6, 3.5, 7.5,
] as const;

export function WineTable({
  wines,
  showActions = true,
  onToggleDrank,
}: {
  wines: Wine[];
  showActions?: boolean;
  onToggleDrank?: (id: string, drank: boolean) => void | Promise<void>;
}) {
  if (wines.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-zinc-500">
        Пусто
      </div>
    );
  }

  const cols = showActions ? [...COL_PCT] : COL_PCT.slice(0, -1);
  const scale = showActions
    ? 1
    : 100 / COL_PCT.slice(0, -1).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full min-w-0 max-md:overflow-x-auto md:overflow-x-visible">
      <table className="w-full min-w-[56rem] table-fixed border-collapse text-[11px] leading-snug sm:min-w-0 sm:text-[12px]">
        <colgroup>
          {cols.map((w, i) => (
            <col
              key={i}
              style={{ width: `${(showActions ? w : w * scale).toFixed(3)}%` }}
            />
          ))}
        </colgroup>
        <thead className="bg-zinc-50 text-center text-[10px] font-semibold text-zinc-600 sm:text-[11px]">
          <tr className="[&>th]:align-bottom [&>th]:px-1 [&>th]:py-1 sm:[&>th]:px-1.5 sm:[&>th]:py-1.5">
            <th className="whitespace-nowrap">Дата</th>
            <th className="whitespace-normal">
              Название
            </th>
            <th className="whitespace-normal">Производитель</th>
            <th className="whitespace-nowrap">Год</th>
            <th className="whitespace-normal">Страна</th>
            <th className="whitespace-normal">Регион</th>
            <th className="whitespace-normal">Апелласьон</th>
            <th className="whitespace-normal">Сорт</th>
            <th className="whitespace-normal">Рейтинг</th>
            <th className="whitespace-nowrap">Покупка</th>
            <th className="whitespace-nowrap">Израиль</th>
            <th className="whitespace-nowrap">Оригинал</th>
            <th className="whitespace-normal">Количество</th>
            {showActions ? <th className="whitespace-nowrap"></th> : null}
          </tr>
        </thead>

        <tbody className="divide-y divide-zinc-100 text-zinc-800">
          {wines.map((w) => {
            const extra = displayNotes(w.notes);
            const ratingsText = displayRatings(w);
            const flag = countryCodeToFlagEmoji(w.countryCode);
            const countryLine = (w.country && w.country.trim()) || "—";
            return (
              <tr
                key={w.id}
                className="[&>td]:align-top [&>td]:px-1 [&>td]:py-1 sm:[&>td]:px-1.5 sm:[&>td]:py-1.5"
              >
                <td className="whitespace-nowrap text-center text-zinc-600">
                  {formatDateRU(w.purchaseDate)}
                </td>
                <td className={`${cellBase} font-medium text-zinc-900`}>
                  <div className="flex flex-col items-center justify-start gap-0.5">
                    <div className="min-w-0 max-w-full break-words">{w.name || "—"}</div>
                    {extra ? (
                      <div className="max-w-full break-words text-[10px] font-normal leading-snug text-zinc-500 sm:text-[11px]">
                        {extra}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className={`${cellBase} text-zinc-700`}>{w.producer || "—"}</td>
                <td className="text-center text-zinc-700">{w.year ?? "—"}</td>
                <td className={`${cellBase} text-zinc-700`}>
                  <div className="flex w-full max-w-full flex-nowrap items-center justify-center gap-1 overflow-hidden">
                    {flag ? (
                      <span
                        className="shrink-0 text-base leading-none sm:text-lg"
                        title={w.countryCode ?? undefined}
                        aria-hidden
                      >
                        {flag}
                      </span>
                    ) : null}
                    <span className="max-w-[min(100%,7rem)] truncate text-center text-[10px] sm:max-w-[min(100%,8.5rem)] sm:text-[11px]">
                      {countryLine}
                    </span>
                  </div>
                </td>
                <td className={`${cellBase} text-zinc-700`}>{w.region || "—"}</td>
                <td className={`${cellBase} text-zinc-600`}>{w.subregion || "—"}</td>
                <td className={`${cellBase} text-zinc-600`}>{w.grape || "—"}</td>
                <td className={cellBase}>{ratingsText || "—"}</td>
                <td className="whitespace-nowrap text-center text-zinc-800">
                  {formatAmountWithCurrency(w.purchasePrice, w.purchaseCurrency)}
                </td>
                <td className="whitespace-nowrap text-center text-zinc-800">
                  {formatAmountWithCurrency(w.israelPrice, w.israelCurrency)}
                </td>
                <td className="whitespace-nowrap text-center text-zinc-800">
                  {formatAmountWithCurrency(w.originPrice, w.originCurrency)}
                </td>
                <td className="text-center font-medium text-zinc-900">{w.quantity}</td>
                {showActions && onToggleDrank ? (
                  <td className="align-top">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => void onToggleDrank(w.id, !w.drank)}
                        className="inline-flex items-center justify-center rounded px-0.5 py-0.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 sm:px-1 sm:text-[11px]"
                      >
                        {w.drank ? "Вернуть" : "Выпить"}
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
