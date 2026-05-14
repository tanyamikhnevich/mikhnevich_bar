"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WineFiltersBar } from "../ui/WineFiltersBar";
import { WineTable } from "../ui/WineTable";
import { formatTableAmount, useWines } from "../../lib/wines";
import type { WinePriceFilterField } from "../../lib/wineFilters";
import {
  filterWinesByToolbar,
  parseOptionalPositiveNumber,
  sortedCountryFilterOptions,
  WINE_TABLE_PAGE_SIZE,
} from "../../lib/wineFilters";

export default function GuestPage() {
  const { wines, loading, error, totals } = useWines();

  const baseList = useMemo(() => wines.filter((w) => !w.drank), [wines]);

  const [nameQuery, setNameQuery] = useState("");
  const [countryKey, setCountryKey] = useState("");
  const [priceField, setPriceField] = useState<WinePriceFilterField>("purchase");
  const [priceMinStr, setPriceMinStr] = useState("");
  const [priceMaxStr, setPriceMaxStr] = useState("");
  const [ratingMinStr, setRatingMinStr] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(WINE_TABLE_PAGE_SIZE);

  const countryOptions = useMemo(
    () => sortedCountryFilterOptions(baseList),
    [baseList],
  );

  const countryFilter = useMemo(
    () => (countryKey && countryOptions.includes(countryKey) ? countryKey : ""),
    [countryKey, countryOptions],
  );

  const filterInput = useMemo(
    () => ({
      nameQuery,
      countryKey: countryFilter,
      priceField,
      priceMin: parseOptionalPositiveNumber(priceMinStr),
      priceMax: parseOptionalPositiveNumber(priceMaxStr),
      ratingMin: parseOptionalPositiveNumber(ratingMinStr),
    }),
    [nameQuery, countryFilter, priceField, priceMinStr, priceMaxStr, ratingMinStr],
  );

  useEffect(() => {
    queueMicrotask(() => setVisibleLimit(WINE_TABLE_PAGE_SIZE));
  }, [filterInput]);

  const filtered = useMemo(
    () => filterWinesByToolbar(baseList, filterInput),
    [baseList, filterInput],
  );

  const visible = useMemo(
    () => filtered.slice(0, visibleLimit),
    [filtered, visibleLimit],
  );

  const canShowMore = filtered.length > visible.length;

  const resetFilters = () => {
    setNameQuery("");
    setCountryKey("");
    setPriceField("purchase");
    setPriceMinStr("");
    setPriceMaxStr("");
    setRatingMinStr("");
  };

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900">
      <header className="w-full border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-[82rem] items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-lg">
                🥂
              </span>
              <h1 className="truncate text-xl font-semibold tracking-tight">
                Режим гостей
              </h1>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              Всего в коллекции {totals.collection} позиций · {totals.bottles} бутылок · сумма
              закупки {formatTableAmount(totals.value)} (как в таблице, без отдельных
              «гостевых» цен)
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            ← Назад
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[82rem] px-4 py-8 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-16 text-center text-sm text-zinc-500">Загрузка…</div>
        ) : (
          <>
            <WineFiltersBar
              nameQuery={nameQuery}
              onNameQuery={setNameQuery}
              countryKey={countryFilter}
              onCountryKey={setCountryKey}
              countryOptions={countryOptions}
              priceField={priceField}
              onPriceField={setPriceField}
              priceMin={priceMinStr}
              onPriceMin={setPriceMinStr}
              priceMax={priceMaxStr}
              onPriceMax={setPriceMaxStr}
              ratingMin={ratingMinStr}
              onRatingMin={setRatingMinStr}
              onReset={resetFilters}
            />

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-zinc-900">Коллекция</h2>
                <div className="text-right text-xs text-zinc-500">
                  <div>Только не выпитые · без кнопок</div>
                  <div className="mt-0.5">
                    {filtered.length} по фильтру
                    {visible.length < filtered.length
                      ? ` · показано ${visible.length} из ${filtered.length}`
                      : null}
                  </div>
                </div>
              </div>

              <WineTable wines={visible} showActions={false} />

              {canShowMore ? (
                <div className="border-t border-zinc-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleLimit((n) => n + WINE_TABLE_PAGE_SIZE)
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                  >
                    Показать ещё {WINE_TABLE_PAGE_SIZE}
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
