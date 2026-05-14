"use client";

import { useEffect, useState } from "react";
import type { WinePriceFilterField } from "../../lib/wineFilters";

const SEARCH_DEBOUNCE_MS = 320;

type Props = {
  nameQuery: string;
  onNameQuery: (v: string) => void;
  countryKey: string;
  onCountryKey: (v: string) => void;
  countryOptions: string[];
  priceField: WinePriceFilterField;
  onPriceField: (v: WinePriceFilterField) => void;
  priceMin: string;
  onPriceMin: (v: string) => void;
  priceMax: string;
  onPriceMax: (v: string) => void;
  ratingMin: string;
  onRatingMin: (v: string) => void;
  onReset: () => void;
};

const PRICE_LABEL: Record<WinePriceFilterField, string> = {
  purchase: "покупка",
  israel: "Израиль",
  origin: "оригинал",
};

export function WineFiltersBar({
  nameQuery,
  onNameQuery,
  countryKey,
  onCountryKey,
  countryOptions,
  priceField,
  onPriceField,
  priceMin,
  onPriceMin,
  priceMax,
  onPriceMax,
  ratingMin,
  onRatingMin,
  onReset,
}: Props) {
  const [searchDraft, setSearchDraft] = useState(nameQuery);

  useEffect(() => {
    setSearchDraft(nameQuery);
  }, [nameQuery]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      onNameQuery(searchDraft);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchDraft, onNameQuery]);

  return (
    <div className="mb-5 space-y-3 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-xs sm:px-4 sm:text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-zinc-800">Поиск и фильтры</span>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-rose-700 hover:underline sm:text-sm"
        >
          Сбросить
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-x-2 lg:gap-y-2">
        <label className="flex min-w-0 flex-col gap-1 lg:col-span-3">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Название</span>
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Поиск…"
            className="h-8 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 sm:h-9 sm:text-sm"
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-2">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Страна</span>
          <select
            value={countryKey}
            onChange={(e) => onCountryKey(e.target.value)}
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 sm:h-9 sm:text-sm"
          >
            <option value="">Все</option>
            {countryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-2">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Цена (поле)</span>
          <select
            value={priceField}
            onChange={(e) => onPriceField(e.target.value as WinePriceFilterField)}
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 sm:h-9 sm:text-sm"
          >
            {(Object.keys(PRICE_LABEL) as WinePriceFilterField[]).map((k) => (
              <option key={k} value={k}>
                {PRICE_LABEL[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-2">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Цена от</span>
          <input
            type="text"
            inputMode="decimal"
            value={priceMin}
            onChange={(e) => onPriceMin(e.target.value)}
            placeholder="—"
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 sm:h-9 sm:text-sm"
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-2">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Цена до</span>
          <input
            type="text"
            inputMode="decimal"
            value={priceMax}
            onChange={(e) => onPriceMax(e.target.value)}
            placeholder="—"
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 sm:h-9 sm:text-sm"
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-1">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Vivino ≥</span>
          <input
            type="text"
            inputMode="decimal"
            value={ratingMin}
            onChange={(e) => onRatingMin(e.target.value)}
            placeholder="—"
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 sm:h-9 sm:text-sm"
          />
        </label>
      </div>
    </div>
  );
}
