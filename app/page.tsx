"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AddWineModal } from "./ui/AddWineModal";
import { DrinkWineModal } from "./ui/DrinkWineModal";
import { WineFiltersBar } from "./ui/WineFiltersBar";
import { SegmentedTabs } from "./ui/SegmentedTabs";
import { GuestWineTable } from "./ui/GuestWineTable";
import { WineTable } from "./ui/WineTable";
import type { GuestSelectionDraft } from "@/lib/guestSelection";
import {
  buildGuestSelectionDraft,
  guestDraftToUpdates,
  validateGuestSelectionDraft,
} from "@/lib/guestSelection";
import type { Wine, WineColor, WineSortKey } from "@/lib/wines";
import {
  formatTableAmount,
  WINE_COLOR_LABEL,
  WINE_COLOR_ORDER,
  WINE_SECTION_HEADER_CLASS,
} from "@/lib/wines";
import { useWineBrowseByColor } from "@/lib/wineBrowse";
import {
  addWineApi,
  deleteWineApi,
  drinkWineApi,
  fetchCollectionWinesApi,
  restoreWineApi,
  saveGuestMenuApi,
  updateWineApi,
} from "@/lib/wineMutations";
import {
  type WinePriceFilterField,
  WINE_TABLE_PAGE_SIZE,
} from "@/lib/wineQuery";
import { homeUrlToBrowseFilters, useHomeWineListUrl } from "@/lib/wineUrlState";

function HomePageContent() {
  const searchParams = useSearchParams();
  const { state, replaceUrl, resetFilters } = useHomeWineListUrl();
  const { tab, filters, sort, limits } = state;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [drinkTarget, setDrinkTarget] = useState<Wine | null>(null);
  const [guestSelectMode, setGuestSelectMode] = useState(false);
  const [guestDraft, setGuestDraft] = useState<GuestSelectionDraft>({});
  const [guestSourceWines, setGuestSourceWines] = useState<Wine[]>([]);
  const [guestValidationIds, setGuestValidationIds] = useState<Set<string>>(
    new Set(),
  );
  const [guestFormError, setGuestFormError] = useState<string | null>(null);
  const [guestSaving, setGuestSaving] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const browseFilters = useMemo(
    () => homeUrlToBrowseFilters(searchParams),
    [searchParams],
  );

  const { data, loading, error, refetch } = useWineBrowseByColor(browseFilters);

  const totals = data?.totals ?? {
    collection: 0,
    drank: 0,
    bottles: 0,
    value: 0,
  };
  const countryOptions = data?.facets.countries ?? [];
  const regionOptions = data?.facets.regions ?? [];

  const effectiveCountryKeys =
    data?.filters.countryKeys ?? filters.countryKeys;
  const effectiveRegionKey = data?.filters.regionKey ?? filters.regionKey;

  const setTab = useCallback(
    (value: "collection" | "drank") => {
      if (guestSelectMode) {
        setGuestSelectMode(false);
        setGuestDraft({});
        setGuestSourceWines([]);
        setGuestValidationIds(new Set());
        setGuestFormError(null);
      }
      replaceUrl({ tab: value }, { clearLimits: true });
    },
    [guestSelectMode, replaceUrl],
  );

  const enterGuestSelectMode = useCallback(() => {
    setGuestLoading(true);
    setGuestFormError(null);
    void fetchCollectionWinesApi()
      .then((collection) => {
        setGuestSourceWines(collection);
        setGuestDraft(buildGuestSelectionDraft(collection));
        setGuestValidationIds(new Set());
        setGuestSelectMode(true);
      })
      .catch((e) => {
        setGuestFormError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setGuestLoading(false));
  }, []);

  const exitGuestSelectMode = useCallback(() => {
    setGuestSelectMode(false);
    setGuestDraft({});
    setGuestSourceWines([]);
    setGuestValidationIds(new Set());
    setGuestFormError(null);
  }, []);

  const patchGuestDraft = useCallback(
    (id: string, patch: Partial<GuestSelectionDraft[string]>) => {
      setGuestDraft((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }));
      setGuestValidationIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [],
  );

  const handleSaveGuestMenu = useCallback(async () => {
    const validation = validateGuestSelectionDraft(guestDraft);
    if (!validation.ok) {
      setGuestValidationIds(new Set(validation.wineIds));
      setGuestFormError("Для каждого выбранного вина укажите цену за бутылку");
      return;
    }
    setGuestSaving(true);
    setGuestFormError(null);
    setGuestValidationIds(new Set());
    try {
      await saveGuestMenuApi(guestDraftToUpdates(guestSourceWines, guestDraft));
      exitGuestSelectMode();
      await refetch();
    } catch (e) {
      const err = e as Error & { wineIds?: string[] };
      if (err.wineIds?.length) setGuestValidationIds(new Set(err.wineIds));
      setGuestFormError(err.message);
    } finally {
      setGuestSaving(false);
    }
  }, [guestDraft, guestSourceWines, exitGuestSelectMode, refetch]);

  const setNameQuery = useCallback(
    (value: string) => {
      replaceUrl({ nameQuery: value }, { clearLimits: true });
    },
    [replaceUrl],
  );

  const setCountryKeys = useCallback(
    (value: string[]) => {
      replaceUrl(
        {
          countryKeys: value,
          ...(value.length === 1 ? {} : { regionKey: "" }),
        },
        { clearLimits: true },
      );
    },
    [replaceUrl],
  );

  const setRegionKey = useCallback(
    (value: string) => {
      replaceUrl({ regionKey: value }, { clearLimits: true });
    },
    [replaceUrl],
  );

  const setPriceField = useCallback(
    (value: WinePriceFilterField) => {
      replaceUrl({ priceField: value }, { clearLimits: true });
    },
    [replaceUrl],
  );

  const setPriceMinStr = useCallback(
    (value: string) => {
      replaceUrl({ priceMinStr: value }, { clearLimits: true });
    },
    [replaceUrl],
  );

  const setPriceMaxStr = useCallback(
    (value: string) => {
      replaceUrl({ priceMaxStr: value }, { clearLimits: true });
    },
    [replaceUrl],
  );

  const setRatingMinStr = useCallback(
    (value: string) => {
      replaceUrl({ ratingMinStr: value }, { clearLimits: true });
    },
    [replaceUrl],
  );

  const setSortBy = useCallback(
    (value: WineSortKey) => {
      replaceUrl({ sortBy: value }, { clearLimits: true });
    },
    [replaceUrl],
  );

  const setSortDir = useCallback(
    (value: "asc" | "desc") => {
      replaceUrl({ sortDir: value }, { clearLimits: true });
    },
    [replaceUrl],
  );

  const showMore = useCallback(
    (color: WineColor) => {
      const next =
        (limits[color] ?? WINE_TABLE_PAGE_SIZE) + WINE_TABLE_PAGE_SIZE;
      replaceUrl({ limits: { ...limits, [color]: next } });
    },
    [limits, replaceUrl],
  );

  const handleDrink = useCallback(
    (wine: Wine) => {
      if (wine.quantity <= 1) {
        void drinkWineApi(wine.id, 1)
          .then(() => refetch())
          .catch((e) => alert(e instanceof Error ? e.message : String(e)));
        return;
      }
      setDrinkTarget(wine);
    },
    [refetch],
  );

  const handleRestore = useCallback(
    (wine: Wine) => {
      void restoreWineApi(wine.id)
        .then(() => refetch())
        .catch((e) => alert(e instanceof Error ? e.message : String(e)));
    },
    [refetch],
  );

  const handleUpdate = useCallback(
    async (wine: Wine, patch: Record<string, unknown>) => {
      await updateWineApi(wine.id, patch);
      await refetch();
    },
    [refetch],
  );

  const handleDelete = useCallback(
    async (wine: Wine) => {
      await deleteWineApi(wine.id);
      await refetch();
    },
    [refetch],
  );

  const hasAnySection =
    data &&
    WINE_COLOR_ORDER.some((c) => (data.sections[c]?.total ?? 0) > 0);

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

        {loading && !data ? (
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

              <div className="flex flex-wrap items-center gap-2">
                {tab === "collection" && !guestSelectMode ? (
                  <button
                    type="button"
                    onClick={enterGuestSelectMode}
                    disabled={guestLoading}
                    className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-60"
                  >
                    {guestLoading ? "Загрузка…" : "Выбрать вина для гостей"}
                  </button>
                ) : null}
                <Link
                  href="/guest"
                  className="inline-flex rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:hidden"
                >
                  Режим гостей
                </Link>
              </div>
            </div>

            {guestSelectMode ? (
              <div className="mb-5 space-y-3 rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3">
                {guestFormError ? (
                  <p className="text-sm font-medium text-red-800">{guestFormError}</p>
                ) : (
                  <p className="text-sm text-rose-950">
                    Отметьте вина для гостевой карты и укажите цены. Вина с нулевым
                    остатком недоступны для выбора.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveGuestMenu()}
                    disabled={guestSaving}
                    className="inline-flex rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
                  >
                    {guestSaving ? "Сохранение…" : "Сохранить гостевую карту"}
                  </button>
                  <button
                    type="button"
                    onClick={exitGuestSelectMode}
                    disabled={guestSaving}
                    className="inline-flex rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                  >
                    Отменить
                  </button>
                </div>
              </div>
            ) : null}

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

            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
              <span className="font-medium text-zinc-700">Сортировка:</span>
              <select
                value={sort.sortBy}
                onChange={(e) => setSortBy(e.target.value as WineSortKey)}
                className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
              >
                <option value="purchaseDate">дата покупки</option>
                <option value="purchasePrice">цена покупки</option>
                <option value="israelPrice">цена в Израиле</option>
                <option value="originPrice">цена (оригинал)</option>
                <option value="vivinoRating">рейтинг Vivino</option>
                <option value="year">год</option>
                <option value="name">название</option>
              </select>
              <select
                value={sort.sortDir}
                onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
              >
                <option value="desc">по убыванию</option>
                <option value="asc">по возрастанию</option>
              </select>
            </div>

            <div className="space-y-6">
              {hasAnySection ? (
                WINE_COLOR_ORDER.filter(
                  (color) => (data?.sections[color]?.total ?? 0) > 0,
                ).map((color) => {
                  const section = data!.sections[color];
                  const visible = section.items;
                  const total = section.total;
                  const canShowMore = visible.length < total;

                  return (
                    <section
                      key={color}
                      className="overflow-x-auto overflow-y-visible rounded-xl border border-zinc-200 bg-white"
                    >
                      <div
                        className={`relative px-4 py-3 ${WINE_SECTION_HEADER_CLASS[color]}`}
                      >
                        <h2 className="text-center text-sm font-semibold">
                          {WINE_COLOR_LABEL[color]}
                        </h2>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right text-xs opacity-80">
                          <div>{total} позиций по фильтру</div>
                          {visible.length < total ? (
                            <div className="mt-0.5">
                              показано {visible.length} из {total}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {guestSelectMode && tab === "collection" ? (
                        <GuestWineTable
                          wines={visible}
                          variant="guestSelect"
                          guestSelection={{
                            draft: guestDraft,
                            onDraftChange: patchGuestDraft,
                            invalidIds: guestValidationIds,
                          }}
                        />
                      ) : (
                        <WineTable
                          wines={visible}
                          showActions
                          countryOptions={countryOptions}
                          onDrink={tab === "collection" ? handleDrink : undefined}
                          onRestore={tab === "drank" ? handleRestore : undefined}
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                        />
                      )}

                      {canShowMore ? (
                        <div className="border-t border-zinc-100 px-4 py-3">
                          <button
                            type="button"
                            onClick={() => showMore(color)}
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                          >
                            Показать ещё {WINE_TABLE_PAGE_SIZE}
                          </button>
                        </div>
                      ) : null}
                    </section>
                  );
                })
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
            await addWineApi({ ...wine, drank: false });
            setIsAddOpen(false);
            await refetch();
          } catch (e) {
            alert(e instanceof Error ? e.message : String(e));
          }
        }}
      />

      <DrinkWineModal
        wine={drinkTarget}
        onClose={() => setDrinkTarget(null)}
        onConfirm={async (quantity) => {
          if (!drinkTarget) return;
          await drinkWineApi(drinkTarget.id, quantity);
          await refetch();
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-zinc-50 py-16 text-center text-sm text-zinc-500">
          Загрузка…
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
