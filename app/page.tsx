"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AddWineModal } from "./ui/AddWineModal";
import { WineFiltersBar } from "./ui/WineFiltersBar";
import { SegmentedTabs } from "./ui/SegmentedTabs";
import { WineTable } from "./ui/WineTable";
import type { Wine, WineColor, WineSortKey } from "../lib/wines";
import {
  formatTableAmount,
  groupWinesByColor,
  sortWines,
  useWines,
  WINE_COLOR_LABEL,
  WINE_COLOR_ORDER,
  WINE_SECTION_HEADER_CLASS,
} from "../lib/wines";
import type { WinePriceFilterField } from "../lib/wineFilters";
import {
  filterWinesByToolbar,
  parseOptionalPositiveNumber,
  sortedCountryFilterOptions,
  WINE_TABLE_PAGE_SIZE,
} from "../lib/wineFilters";

export default function Home() {
  const { wines, loading, error, addWine, updateWine, totals } = useWines();
  const [tab, setTab] = useState<"collection" | "drank">("collection");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sortBy, setSortBy] = useState<WineSortKey>("none");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [nameQuery, setNameQuery] = useState("");
  const [countryKey, setCountryKey] = useState("");
  const [priceField, setPriceField] = useState<WinePriceFilterField>("purchase");
  const [priceMinStr, setPriceMinStr] = useState("");
  const [priceMaxStr, setPriceMaxStr] = useState("");
  const [ratingMinStr, setRatingMinStr] = useState("");
  const [limitByColor, setLimitByColor] = useState<Partial<Record<WineColor, number>>>(
    {},
  );

  const tabWines = useMemo(
    () => wines.filter((w) => (tab === "drank" ? w.drank : !w.drank)),
    [tab, wines],
  );

  const countryOptions = useMemo(() => sortedCountryFilterOptions(tabWines), [tabWines]);

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
    queueMicrotask(() => setLimitByColor({}));
  }, [tab, filterInput]);

  const filteredList = useMemo(
    () => filterWinesByToolbar(tabWines, filterInput),
    [tabWines, filterInput],
  );

  const filtered = useMemo(() => groupWinesByColor(filteredList), [filteredList]);

  const sortedFiltered = useMemo(() => {
    const out = {} as Record<WineColor, Wine[]>;
    for (const c of WINE_COLOR_ORDER) {
      out[c] = sortWines(filtered[c], sortBy, sortDir);
    }
    return out;
  }, [filtered, sortBy, sortDir]);

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
                🍷
              </span>
              <h1 className="truncate text-xl font-semibold tracking-tight">
                Моя Коллекция Вин
              </h1>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {totals.bottles} бутылок в коллекции · {formatTableAmount(totals.value)}{" "}
              сумма закупки (активные)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/guest"
              className="hidden rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:inline-flex"
            >
              Режим гостей
            </Link>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center justify-center rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              + Добавить вино
            </button>
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
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <SegmentedTabs
                value={tab}
                onChange={setTab}
                options={[
                  { value: "collection", label: `Коллекция (${totals.collection})` },
                  { value: "drank", label: `Выпито (${totals.drank})` },
                ]}
              />

              <Link
                href="/guest"
                className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:hidden"
              >
                Режим гостей
              </Link>
            </div>

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

            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
              <span className="font-medium text-zinc-700">Сортировка:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as WineSortKey)}
                className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
              >
                <option value="none">как пришло с сервера</option>
                <option value="purchaseDate">дата покупки</option>
                <option value="purchasePrice">цена покупки</option>
                <option value="israelPrice">цена в Израиле</option>
                <option value="originPrice">цена (оригинал)</option>
                <option value="vivinoRating">рейтинг Vivino</option>
                <option value="year">год</option>
                <option value="name">название</option>
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
                disabled={sortBy === "none"}
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

                        <WineTable
                          wines={visible}
                          showActions
                          onToggleDrank={(id, drank) =>
                            void updateWine(id, { drank }).catch((e) =>
                              alert(e instanceof Error ? e.message : String(e)),
                            )
                          }
                        />

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
                  Нет вин в этом разделе или по заданным фильтрам
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <AddWineModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={async (wine) => {
          try {
            await addWine({ ...wine, drank: false });
            setIsAddOpen(false);
          } catch (e) {
            alert(e instanceof Error ? e.message : String(e));
          }
        }}
      />
    </div>
  );
}
