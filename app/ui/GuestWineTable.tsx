"use client";

import type { GuestSelectionDraft } from "@/lib/guestSelection";
import type { Wine } from "@/lib/wines";
import {
  displayNotes,
  displayRatings,
  formatAmountWithCurrency,
  formatDateRU,
  formatTableAmount,
  formatWineYear,
} from "@/lib/wines";
import { countryCodeToFlagEmoji } from "@/lib/wineUtils";

const cellBase = "min-w-0 break-words align-top text-center text-zinc-800";

const COL_PCT_COLLECTION = [
  5.5, 10, 13, 3, 9, 8, 7, 6.5, 8.5, 6.5, 6, 6, 3.5, 7.5,
] as const;

const COL_PCT_GUEST = [14, 14, 4, 10, 9, 9, 9, 10, 10.5, 10.5] as const;

/** 16 колонок без «Выпить»: дата … кол-во, гости, цена бут., цена бок. */
const COL_PCT_GUEST_SELECT = [
  4.5, 8.5, 10.5, 2.8, 7, 6, 5.5, 5, 6, 5.2, 5.2, 5.2, 3.2, 3.8, 7.5, 7.5,
] as const;

const inputClass =
  "h-7 w-full max-w-[4.5rem] rounded border border-zinc-200 bg-white px-1 text-center text-[10px] text-zinc-900 sm:h-8 sm:max-w-[5rem] sm:text-[11px]";

function scaleCols(cols: readonly number[]) {
  const sum = cols.reduce((a, b) => a + b, 0);
  return cols.map((w) => (w / sum) * 100);
}

type BaseProps = {
  wines: Wine[];
};

type CollectionProps = BaseProps & {
  variant?: "collection";
  showActions?: boolean;
  onToggleDrank?: (id: string, drank: boolean) => void | Promise<void>;
  guestSelection?: never;
};

type GuestProps = BaseProps & {
  variant: "guest";
  showActions?: never;
  onToggleDrank?: never;
  guestSelection?: never;
};

type GuestSelectProps = BaseProps & {
  variant: "guestSelect";
  guestSelection: {
    draft: GuestSelectionDraft;
    onDraftChange: (id: string, patch: Partial<GuestSelectionDraft[string]>) => void;
    invalidIds?: Set<string>;
  };
  showActions?: boolean;
  onToggleDrank?: (id: string, drank: boolean) => void | Promise<void>;
};

export type WineTableProps = CollectionProps | GuestProps | GuestSelectProps;

export function GuestWineTable(props: WineTableProps) {
  const { wines, variant = "collection" } = props;
  const showActions =
    variant !== "guest" && (props.showActions ?? true) && props.onToggleDrank;
  const guestSelect = variant === "guestSelect" ? props.guestSelection : undefined;
  const invalidIds = guestSelect?.invalidIds;

  if (wines.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-zinc-500">
        Пусто
      </div>
    );
  }

  let colWidths: number[];
  if (variant === "guest") {
    colWidths = scaleCols(COL_PCT_GUEST);
  } else if (variant === "guestSelect") {
    colWidths = scaleCols(COL_PCT_GUEST_SELECT);
  } else {
    const cols = showActions ? [...COL_PCT_COLLECTION] : COL_PCT_COLLECTION.slice(0, -1);
    const scale = showActions
      ? 1
      : 100 / COL_PCT_COLLECTION.slice(0, -1).reduce((a, b) => a + b, 0);
    colWidths = cols.map((w) => (showActions ? w : w * scale));
  }

  const tableMinW =
    variant === "guestSelect" ? "min-w-[70rem]" : variant === "guest" ? "min-w-[52rem]" : "min-w-[56rem]";

  return (
    <div
      className={[
        "w-full min-w-0",
        variant === "guestSelect" ? "overflow-x-auto" : "max-md:overflow-x-auto md:overflow-x-visible",
      ].join(" ")}
    >
      <table
        className={`w-full ${tableMinW} table-fixed border-collapse text-[11px] leading-snug sm:text-[12px]`}
      >
        <colgroup>
          {colWidths.map((w, i) => (
            <col key={i} style={{ width: `${w.toFixed(3)}%` }} />
          ))}
        </colgroup>
        <thead className="bg-zinc-50 text-center text-[10px] font-semibold text-zinc-600 sm:text-[11px]">
          <tr className="[&>th]:align-bottom [&>th]:px-1 [&>th]:py-1 sm:[&>th]:px-1.5 sm:[&>th]:py-1.5">
            {variant === "guest" ? (
              <>
                <th className="whitespace-normal">Название</th>
                <th className="whitespace-normal">Производитель</th>
                <th className="whitespace-nowrap">Год</th>
                <th className="whitespace-normal">Страна</th>
                <th className="whitespace-normal">Регион</th>
                <th className="whitespace-normal">Апелласьон</th>
                <th className="whitespace-normal">Сорт</th>
                <th className="whitespace-normal">Рейтинг</th>
                <th className="whitespace-nowrap">Бутылка</th>
                <th className="whitespace-nowrap">Бокал</th>
              </>
            ) : (
              <>
                <th className="whitespace-nowrap">Дата</th>
                <th className="whitespace-normal">Название</th>
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
                <th className="whitespace-nowrap">Кол.</th>
                {guestSelect ? (
                  <>
                    <th className="whitespace-nowrap px-0.5">Гости</th>
                    <th className="whitespace-nowrap px-1">Бут.</th>
                    <th className="whitespace-nowrap px-1">Бок.</th>
                  </>
                ) : null}
                {showActions ? <th className="whitespace-nowrap"></th> : null}
              </>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-zinc-100 text-zinc-800">
          {wines.map((w) => {
            const extra = displayNotes(w.notes);
            const ratingsText = displayRatings(w);
            const flag = countryCodeToFlagEmoji(w.countryCode);
            const countryLine = (w.country && w.country.trim()) || "—";
            const outOfStock = w.quantity <= 0;
            const draft = guestSelect?.draft[w.id];
            const rowInvalid = invalidIds?.has(w.id);

            const nameCell = (
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
            );

            const countryCell = (
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
            );

            if (variant === "guest") {
              return (
                <tr
                  key={w.id}
                  className="[&>td]:align-top [&>td]:px-1 [&>td]:py-1 sm:[&>td]:px-1.5 sm:[&>td]:py-1.5"
                >
                  {nameCell}
                  <td className={`${cellBase} text-zinc-700`}>{w.producer || "—"}</td>
                  <td className="text-center text-zinc-700">{formatWineYear(w.year)}</td>
                  {countryCell}
                  <td className={`${cellBase} text-zinc-700`}>{w.region || "—"}</td>
                  <td className={`${cellBase} text-zinc-600`}>{w.subregion || "—"}</td>
                  <td className={`${cellBase} text-zinc-600`}>{w.grape || "—"}</td>
                  <td className={cellBase}>{ratingsText || "—"}</td>
                  <td className="whitespace-nowrap text-center font-medium text-zinc-900">
                    {formatTableAmount(w.guestBottlePrice)}
                  </td>
                  <td className="whitespace-nowrap text-center text-zinc-800">
                    {formatTableAmount(w.guestGlassPrice)}
                  </td>
                </tr>
              );
            }

            return (
              <tr
                key={w.id}
                className={[
                  "[&>td]:align-top [&>td]:px-1 [&>td]:py-1 sm:[&>td]:px-1.5 sm:[&>td]:py-1.5",
                  outOfStock && guestSelect ? "bg-zinc-50/80 opacity-60" : "",
                  rowInvalid ? "bg-red-50/60" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <td className="whitespace-nowrap text-center text-zinc-600">
                  {formatDateRU(w.purchaseDate)}
                </td>
                {nameCell}
                <td className={`${cellBase} text-zinc-700`}>{w.producer || "—"}</td>
                <td className="text-center text-zinc-700">{w.year ?? "—"}</td>
                {countryCell}
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

                {guestSelect ? (
                  outOfStock ? (
                    <>
                      <td colSpan={3} className="text-center text-[10px] text-zinc-500 sm:text-[11px]">
                        Нет в наличии
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="align-top px-0.5">
                        <div className="flex justify-center pt-0.5">
                          <input
                            type="checkbox"
                            checked={draft?.selected ?? false}
                            onChange={(e) =>
                              guestSelect.onDraftChange(w.id, { selected: e.target.checked })
                            }
                            className="size-3.5 rounded border-zinc-300 text-rose-700 focus:ring-rose-500 sm:size-4"
                            aria-label={`Включить ${w.name} в гостевую карту`}
                          />
                        </div>
                      </td>
                      <td className="align-top px-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={draft?.bottlePrice ?? ""}
                          onChange={(e) =>
                            guestSelect.onDraftChange(w.id, { bottlePrice: e.target.value })
                          }
                          disabled={!(draft?.selected ?? false)}
                          placeholder="—"
                          className={[
                            inputClass,
                            rowInvalid ? "border-red-400 bg-red-50" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-invalid={rowInvalid || undefined}
                        />
                        {rowInvalid ? (
                          <div className="mt-0.5 text-center text-[9px] text-red-600 sm:text-[10px]">
                            Укажите цену
                          </div>
                        ) : null}
                      </td>
                      <td className="align-top px-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={draft?.glassPrice ?? ""}
                          onChange={(e) =>
                            guestSelect.onDraftChange(w.id, { glassPrice: e.target.value })
                          }
                          disabled={!(draft?.selected ?? false)}
                          placeholder="—"
                          className={inputClass}
                        />
                      </td>
                    </>
                  )
                ) : null}

                {showActions && props.onToggleDrank ? (
                  <td className="align-top">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => void props.onToggleDrank!(w.id, !w.drank)}
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
