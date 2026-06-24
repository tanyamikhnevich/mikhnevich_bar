"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AddWineModal } from "./ui/AddWineModal";
import { DrinkWineModal } from "./ui/DrinkWineModal";
import { AppHeader } from "./ui/AppHeader";
import { GuestSelectFooter } from "./ui/GuestSelectFooter";
import { LoadingSpinner, TableLoadingPanel } from "./ui/LoadingSpinner";
import { SortBar } from "./ui/SortBar";
import { WineFiltersBar } from "./ui/WineFiltersBar";
import { SegmentedTabs } from "./ui/SegmentedTabs";
import { GuestWineTable } from "./ui/GuestWineTable";
import { WineTable } from "./ui/WineTable";
import type { GuestSelectionDraft } from "@/lib/guestSelection";
import {
  buildGuestSelectionDraft,
  guestDraftToUpdates,
  patchGuestDraftRow,
  validateGuestSelectionDraft,
} from "@/lib/guestSelection";
import {
  defaultSortForContext,
  sortOptionsFor,
} from "@/lib/wineListUi";
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
  const router = useRouter();
  const pathname = usePathname();
  const { state, replaceUrl, resetFilters } = useHomeWineListUrl();
  const { tab, filters, sort } = state;
  const [colorLimits, setColorLimits] = useState<
    Partial<Record<WineColor, number>>
  >({});

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addWineCopyFrom, setAddWineCopyFrom] = useState<Wine | null>(null);

  const openAddWine = useCallback((copyFrom?: Wine) => {
    setAddWineCopyFrom(copyFrom ?? null);
    setIsAddOpen(true);
  }, []);

  const closeAddWine = useCallback(() => {
    setIsAddOpen(false);
    setAddWineCopyFrom(null);
  }, []);
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
    () => ({
      ...homeUrlToBrowseFilters(searchParams),
      limits: colorLimits,
    }),
    [searchParams, colorLimits],
  );

  const patchUrl = useCallback(
    (
      patch: Parameters<typeof replaceUrl>[0],
      options?: Parameters<typeof replaceUrl>[1],
    ) => {
      if (options?.clearLimits) setColorLimits({});
      replaceUrl(patch, options);
    },
    [replaceUrl],
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let stripped = false;
    for (const color of WINE_COLOR_ORDER) {
      if (params.has(`${color}Limit`)) {
        params.delete(`${color}Limit`);
        stripped = true;
      }
    }
    if (!stripped) return;
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const { data, loading, isRefreshing, loadingMoreColor, error, refetch } =
    useWineBrowseByColor(browseFilters);

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
      patchUrl({ tab: value }, { clearLimits: true });
    },
    [guestSelectMode, patchUrl],
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
      setGuestDraft((prev) => {
        const current = prev[id];
        if (!current) return prev;
        return {
          ...prev,
          [id]: patchGuestDraftRow(current, patch),
        };
      });
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
      patchUrl({ nameQuery: value }, { clearLimits: true });
    },
    [patchUrl],
  );

  const setCountryKeys = useCallback(
    (value: string[]) => {
      patchUrl(
        {
          countryKeys: value,
          ...(value.length === 1 ? {} : { regionKey: "" }),
        },
        { clearLimits: true },
      );
    },
    [patchUrl],
  );

  const setRegionKey = useCallback(
    (value: string) => {
      patchUrl({ regionKey: value }, { clearLimits: true });
    },
    [patchUrl],
  );

  const setPriceField = useCallback(
    (value: WinePriceFilterField) => {
      patchUrl({ priceField: value }, { clearLimits: true });
    },
    [patchUrl],
  );

  const setPriceMinStr = useCallback(
    (value: string) => {
      patchUrl({ priceMinStr: value }, { clearLimits: true });
    },
    [patchUrl],
  );

  const setPriceMaxStr = useCallback(
    (value: string) => {
      patchUrl({ priceMaxStr: value }, { clearLimits: true });
    },
    [patchUrl],
  );

  const setRatingMinStr = useCallback(
    (value: string) => {
      patchUrl({ ratingMinStr: value }, { clearLimits: true });
    },
    [patchUrl],
  );

  const setSortBy = useCallback(
    (value: WineSortKey) => {
      patchUrl({ sortBy: value }, { clearLimits: true });
    },
    [patchUrl],
  );

  const setSortDir = useCallback(
    (value: "asc" | "desc") => {
      patchUrl({ sortDir: value }, { clearLimits: true });
    },
    [patchUrl],
  );

  const showMore = useCallback(
    (color: WineColor) => {
      if (loadingMoreColor) return;
      setColorLimits((prev) => ({
        ...prev,
        [color]: (prev[color] ?? WINE_TABLE_PAGE_SIZE) + WINE_TABLE_PAGE_SIZE,
      }));
    },
    [loadingMoreColor],
  );

  const handleResetFilters = useCallback(() => {
    setColorLimits({});
    resetFilters();
  }, [resetFilters]);

  const handleDrink = useCallback((wine: Wine) => {
    setDrinkTarget(wine);
  }, []);

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

  const sortOptions = sortOptionsFor(tab);

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
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 active:bg-zinc-50 sm:min-h-9 sm:rounded-lg sm:px-3 sm:py-2"
            >
              Гости
            </Link>
            {tab === "collection" && guestSelectMode ? (
              <button
                type="button"
                onClick={exitGuestSelectMode}
                disabled={guestSaving}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 active:bg-zinc-50 disabled:opacity-60 sm:min-h-9 sm:rounded-lg sm:px-3 sm:py-2"
              >
                Отменить
              </button>
            ) : tab === "collection" ? (
              <button
                type="button"
                onClick={enterGuestSelectMode}
                disabled={guestLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-800 active:bg-rose-100 disabled:opacity-60 sm:min-h-9 sm:rounded-lg sm:py-2"
              >
                {guestLoading ? "Загрузка…" : "Выбрать вина для гостей"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openAddWine()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white active:bg-rose-800 sm:min-h-9 sm:rounded-lg sm:px-4 sm:py-2"
            >
              + Добавить
            </button>
          </>
        }
      />

      <main className="mx-auto w-full max-w-[82rem] px-3 py-4 sm:px-6 sm:py-8">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {loading && !data ? (
          <TableLoadingPanel />
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:mb-5">
              <SegmentedTabs
                value={tab}
                onChange={setTab}
                disabled={isRefreshing}
                options={[
                  { value: "collection", label: `Коллекция (${totals.collection})` },
                  { value: "drank", label: `Выпито (${totals.drank})` },
                ]}
              />

            </div>

            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <WineFiltersBar
                filterContext={tab}
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
                onReset={handleResetFilters}
              />
              <SortBar
                sortBy={sort.sortBy}
                sortDir={sort.sortDir}
                onSortBy={setSortBy}
                onSortDir={setSortDir}
                options={sortOptions}
              />
            </div>

            <div className="relative min-h-[calc(100dvh-14rem)] space-y-6">
              {isRefreshing ? (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-50/75"
                  aria-busy="true"
                >
                  <LoadingSpinner label="Загрузка…" />
                </div>
              ) : null}
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
                      className="rounded-xl border border-zinc-200 bg-white shadow-sm"
                    >
                      <div
                        className={`px-4 py-2 ${WINE_SECTION_HEADER_CLASS[color]}`}
                      >
                        <h2 className="text-sm font-semibold">
                          {WINE_COLOR_LABEL[color]}
                        </h2>
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
                          variant={tab === "drank" ? "drank" : "collection"}
                          wines={visible}
                          showActions
                          countryOptions={countryOptions}
                          onDrink={tab === "collection" ? handleDrink : undefined}
                          onRestore={tab === "drank" ? handleRestore : undefined}
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                          onCopy={
                            tab === "collection"
                              ? (wine) => openAddWine(wine)
                              : undefined
                          }
                        />
                      )}

                      {canShowMore ? (
                        <div className="border-t border-zinc-100 px-4 py-2">
                          <button
                            type="button"
                            onClick={() => showMore(color)}
                            disabled={loadingMoreColor !== null}
                            className="flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-800 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {loadingMoreColor === color ? (
                              <LoadingSpinner label="Загрузка…" />
                            ) : (
                              "Показать ещё"
                            )}
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

            {guestSelectMode && tab === "collection" ? (
              <GuestSelectFooter
                error={guestFormError}
                saving={guestSaving}
                onSave={() => void handleSaveGuestMenu()}
                onCancel={exitGuestSelectMode}
              />
            ) : null}
          </>
        )}
      </main>

      <AddWineModal
        open={isAddOpen}
        copyFrom={addWineCopyFrom}
        onClose={closeAddWine}
        onSubmit={async (wine) => {
          await addWineApi({ ...wine, drank: false });
          closeAddWine();
          await refetch();
        }}
      />

      <DrinkWineModal
        wine={drinkTarget}
        onClose={() => setDrinkTarget(null)}
        onConfirm={async (input) => {
          if (!drinkTarget) return;
          await drinkWineApi(drinkTarget.id, input);
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
