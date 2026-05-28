"use client";

import { useEffect, useMemo, useState } from "react";
import { WineFiltersBar } from "../ui/WineFiltersBar";
import { GuestWineTable } from "../ui/GuestWineTable";
import { useGuestWines } from "@/lib/wines";
import type { WineColor, WineSortKey } from "@/lib/wines";
import {
  groupWinesByColor,
  sortWines,
  WINE_COLOR_LABEL,
  WINE_COLOR_ORDER,
  WINE_SECTION_HEADER_CLASS,
} from "@/lib/wines";
import type { WinePriceFilterField } from "@/lib/wineQuery";
import {
  filterWinesByToolbar,
  parseOptionalPositiveNumber,
  sortedCountryFilterOptions,
  wineCountryFilterKey,
  WINE_TABLE_PAGE_SIZE,
} from "@/lib/wineFilters";

export default function GuestPage() {
  const { wines, loading, error } = useGuestWines();

  const [nameQuery, setNameQuery] = useState("");
  const [countryKeys, setCountryKeys] = useState<string[]>([]);
  const [regionKey, setRegionKey] = useState("");
  const [priceField, setPriceField] = useState<WinePriceFilterField>("guestBottle");
  const [priceMinStr, setPriceMinStr] = useState("");
  const [priceMaxStr, setPriceMaxStr] = useState("");
  const [ratingMinStr, setRatingMinStr] = useState("");
  const [sortBy, setSortBy] = useState<WineSortKey>("guestBottlePrice");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [limitByColor, setLimitByColor] = useState<Partial<Record<WineColor, number>>>(
    {},
  );

  const countryOptions = useMemo(() => sortedCountryFilterOptions(wines), [wines]);

  const effectiveCountryKeys = useMemo(
    () => countryKeys.filter((k) => countryOptions.includes(k)),
    [countryKeys, countryOptions],
  );

  const regionOptions = useMemo(() => {
    if (effectiveCountryKeys.length !== 1) return [] as string[];
    const s = new Set<string>();
    for (const w of wines) {
      if (wineCountryFilterKey(w) !== effectiveCountryKeys[0]) continue;
      const r = w.region?.trim();
      if (r) s.add(r);
    }
    return [...s].sort((a, b) => a.localeCompare(b, "ru"));
  }, [wines, effectiveCountryKeys]);

  const effectiveRegionKey = useMemo(
    () => (regionKey && regionOptions.includes(regionKey) ? regionKey : ""),
    [regionKey, regionOptions],
  );

  const filterInput = useMemo(
    () => ({
      nameQuery,
      countryKeys: effectiveCountryKeys,
      priceField,
      priceMin: parseOptionalPositiveNumber(priceMinStr),
      priceMax: parseOptionalPositiveNumber(priceMaxStr),
      ratingMin: parseOptionalPositiveNumber(ratingMinStr),
    }),
    [nameQuery, effectiveCountryKeys, priceField, priceMinStr, priceMaxStr, ratingMinStr],
  );

  useEffect(() => {
    queueMicrotask(() => setLimitByColor({}));
  }, [filterInput]);

  const filteredList = useMemo(() => {
    let list = filterWinesByToolbar(wines, filterInput);
    if (effectiveRegionKey) {
      list = list.filter((w) => (w.region?.trim() ?? "") === effectiveRegionKey);
    }
    return list;
  }, [wines, filterInput, effectiveRegionKey]);

  const filtered = useMemo(() => groupWinesByColor(filteredList), [filteredList]);

  const sortedFiltered = useMemo(() => {
    const out = {} as Record<WineColor, typeof wines>;
    for (const c of WINE_COLOR_ORDER) {
      out[c] = sortWines(filtered[c], sortBy, sortDir);
    }
    return out;
  }, [filtered, sortBy, sortDir]);

  const guestCount = wines.length;

  const resetFilters = () => {
    setNameQuery("");
    setCountryKeys([]);
    setRegionKey("");
    setPriceField("guestBottle");
    setPriceMinStr("");
    setPriceMaxStr("");
    setRatingMinStr("");
  };

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900">
      <header className="w-full border-b border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-[82rem] px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-lg">
                🥂
              </span>
              <h1 className="truncate text-xl font-semibold tracking-tight">
                Гостевая карта
              </h1>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {guestCount === 0
                ? "Пока нет вин в гостевой карте"
                : `${guestCount} позиций в гостевой карте`}
            </p>
          </div>
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
              countryKeys={effectiveCountryKeys}
              onCountryKeys={setCountryKeys}
              countryOptions={countryOptions}
              regionKey={effectiveRegionKey}
              onRegionKey={setRegionKey}
              regionOptions={regionOptions}
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

            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
              <span className="font-medium text-zinc-700">Сортировка:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as WineSortKey)}
                className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
              >
                <option value="guestBottlePrice">цена за бутылку</option>
                <option value="guestGlassPrice">цена за бокал</option>
                <option value="vivinoRating">рейтинг Vivino</option>
                <option value="year">год</option>
                <option value="name">название</option>
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
              >
                <option value="desc">по убыванию</option>
                <option value="asc">по возрастанию</option>
              </select>
            </div>

            <div className="space-y-6">
              {WINE_COLOR_ORDER.some((c) => sortedFiltered[c].length > 0) ? (
                WINE_COLOR_ORDER.filter((color) => sortedFiltered[color].length > 0).map(
                  (color) => {
                    const full = sortedFiltered[color];
                    const limit = limitByColor[color] ?? WINE_TABLE_PAGE_SIZE;
                    const visible = full.slice(0, limit);
                    const canShowMore = full.length > visible.length;

                    return (
                      <section
                        key={color}
                        className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
                      >
                        <div
                          className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${WINE_SECTION_HEADER_CLASS[color]}`}
                        >
                          <h2 className="text-sm font-semibold">
                            {WINE_COLOR_LABEL[color]}
                          </h2>
                          <div className="text-right text-xs opacity-80">
                            <div>{full.length} позиций по фильтру</div>
                            {visible.length < full.length ? (
                              <div className="mt-0.5">
                                показано {visible.length} из {full.length}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <GuestWineTable wines={visible} variant="guest" />

                        {canShowMore ? (
                          <div className="border-t border-zinc-100 px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                setLimitByColor((prev) => ({
                                  ...prev,
                                  [color]:
                                    (prev[color] ?? WINE_TABLE_PAGE_SIZE) +
                                    WINE_TABLE_PAGE_SIZE,
                                }))
                              }
                              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                            >
                              Показать ещё {WINE_TABLE_PAGE_SIZE}
                            </button>
                          </div>
                        ) : null}
                      </section>
                    );
                  },
                )
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">
                  В гостевой карте пока нет вин. Выберите позиции на главной странице и
                  сохраните гостевую карту.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
