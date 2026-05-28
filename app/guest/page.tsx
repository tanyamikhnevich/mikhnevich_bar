"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { WineFiltersBar } from "../ui/WineFiltersBar";
import { WineTable } from "../ui/WineTable";
import { formatTableAmount } from "../../lib/wines";
import { useWineBrowseFlat } from "../../lib/wineBrowse";
import { WINE_TABLE_PAGE_SIZE } from "../../lib/wineFilters";
import { guestUrlToBrowseFilters, useGuestWineListUrl } from "../../lib/wineUrlState";

function GuestPageContent() {
  const searchParams = useSearchParams();
  const { state, replaceUrl, resetFilters } = useGuestWineListUrl();
  const { filters, limit } = state;

  const browseParams = useMemo(
    () => guestUrlToBrowseFilters(searchParams),
    [searchParams],
  );

  const { data, loading, error } = useWineBrowseFlat(browseParams);

  const totals = data?.totals ?? {
    collection: 0,
    drank: 0,
    bottles: 0,
    value: 0,
  };
  const countryOptions = data?.facets.countries ?? [];
  const regionOptions = data?.facets.regions ?? [];
  const effectiveCountryKeys =
    data?.filters?.countryKeys ?? filters.countryKeys;
  const effectiveRegionKey = data?.filters?.regionKey ?? filters.regionKey;

  const filteredTotal = data?.total ?? 0;
  const visible = data?.items ?? [];
  const canShowMore = visible.length < filteredTotal;

  const setNameQuery = (value: string) => {
    replaceUrl({ nameQuery: value }, { clearLimits: true });
  };

  const setCountryKeys = (value: string[]) => {
    replaceUrl(
      {
        countryKeys: value,
        ...(value.length === 1 ? {} : { regionKey: "" }),
      },
      { clearLimits: true },
    );
  };

  const setRegionKey = (value: string) => {
    replaceUrl({ regionKey: value }, { clearLimits: true });
  };

  const setPriceField = (value: typeof filters.priceField) => {
    replaceUrl({ priceField: value }, { clearLimits: true });
  };

  const setPriceMinStr = (value: string) => {
    replaceUrl({ priceMinStr: value }, { clearLimits: true });
  };

  const setPriceMaxStr = (value: string) => {
    replaceUrl({ priceMaxStr: value }, { clearLimits: true });
  };

  const setRatingMinStr = (value: string) => {
    replaceUrl({ ratingMinStr: value }, { clearLimits: true });
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

        {loading && !data ? (
          <div className="py-16 text-center text-sm text-zinc-500">Загрузка…</div>
        ) : (
          <>
            <WineFiltersBar
              nameQuery={filters.nameQuery}
              onNameQuery={setNameQuery}
              countryKeys={effectiveCountryKeys}
              onCountryKeys={setCountryKeys}
              countryOptions={countryOptions}
              regionKey={effectiveRegionKey}
              onRegionKey={setRegionKey}
              regionOptions={regionOptions}
              priceField={filters.priceField}
              onPriceField={setPriceField}
              priceMin={filters.priceMinStr}
              onPriceMin={setPriceMinStr}
              priceMax={filters.priceMaxStr}
              onPriceMax={setPriceMaxStr}
              ratingMin={filters.ratingMinStr}
              onRatingMin={setRatingMinStr}
              onReset={resetFilters}
            />

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-zinc-900">Коллекция</h2>
                <div className="text-right text-xs text-zinc-500">
                  <div>Только не выпитые · без кнопок</div>
                  <div className="mt-0.5">
                    {filteredTotal} по фильтру
                    {visible.length < filteredTotal
                      ? ` · показано ${visible.length} из ${filteredTotal}`
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
                      replaceUrl({ limit: limit + WINE_TABLE_PAGE_SIZE })
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

export default function GuestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-zinc-50 py-16 text-center text-sm text-zinc-500">
          Загрузка…
        </div>
      }
    >
      <GuestPageContent />
    </Suspense>
  );
}
