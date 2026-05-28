"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AddWineModal } from "./ui/AddWineModal";
import { DrinkWineModal } from "./ui/DrinkWineModal";
import { AppHeader } from "./ui/AppHeader";
import { GuestSelectBar } from "./ui/GuestSelectBar";
import { SortBar } from "./ui/SortBar";
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

  const sortOptions: { value: WineSortKey; label: string }[] = [
    { value: "purchaseDate", label: "дата покупки" },
    { value: "purchasePrice", label: "цена покупки" },
    { value: "israelPrice", label: "цена в Израиле" },
    { value: "originPrice", label: "цена (оригинал)" },
    { value: "vivinoRating", label: "рейтинг Vivino" },
    { value: "year", label: "год" },
    { value: "name", label: "название" },
  ];

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900">
      <AppHeader
        emoji="🍷"
        title="Моя коллекция"
        subtitle={
          <>
            {totals.bottles} бут. · закупка {formatTableAmount(totals.value)}
          </>
        }
        actions={
          <>
            <Link
              href="/guest"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 active:bg-zinc-50 sm:rounded-lg sm:px-3 sm:py-2"
            >
              Гости
            </Link>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white active:bg-rose-800 sm:rounded-lg sm:px-4 sm:py-2"
            >
              + Добавить
            </button>
          </>
        }
      />

      <main
        className={[
          "mx-auto w-full max-w-[82rem] px-3 py-4 sm:px-6 sm:py-8",
          guestSelectMode ? "pb-28 md:pb-8" : "",
        ].join(" ")}
      >
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {loading && !data ? (
          <div className="py-16 text-center text-sm text-zinc-500">Загрузка…</div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:mb-5">
              <SegmentedTabs
                value={tab}
                onChange={setTab}
                options={[
                  { value: "collection", label: `Коллекция (${totals.collection})` },
                  { value: "drank", label: `Выпито (${totals.drank})` },
                ]}
              />

              {tab === "collection" && !guestSelectMode ? (
                <button
                  type="button"
                  onClick={enterGuestSelectMode}
                  disabled={guestLoading}
                  className="min-h-11 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-800 active:bg-rose-100 disabled:opacity-60 sm:w-auto sm:rounded-lg sm:px-3 sm:py-2"
                >
                  {guestLoading ? "Загрузка…" : "Выбрать вина для гостей"}
                </button>
              ) : null}
            </div>

            {guestSelectMode ? (
              <GuestSelectBar
                error={guestFormError}
                saving={guestSaving}
                onSave={() => void handleSaveGuestMenu()}
                onCancel={exitGuestSelectMode}
              />
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

            <SortBar
              sortBy={sort.sortBy}
              sortDir={sort.sortDir}
              onSortBy={setSortBy}
              onSortDir={setSortDir}
              options={sortOptions}
            />

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
                      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                    >
                      <div
                        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:relative ${WINE_SECTION_HEADER_CLASS[color]}`}
                      >
                        <h2 className="text-sm font-semibold">
                          {WINE_COLOR_LABEL[color]}
                        </h2>
                        <div className="text-xs opacity-80 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2 sm:text-right">
                          <div>{total} по фильтру</div>
                          {visible.length < total ? (
                            <div className="mt-0.5">
                              {visible.length} из {total}
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
                            className="min-h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-800 active:bg-zinc-100 sm:rounded-lg sm:py-2"
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
