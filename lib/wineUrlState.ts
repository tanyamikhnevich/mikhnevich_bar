"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  defaultSortForContext,
  emptyWineUrlFilters,
  isSortKeyValidForContext,
  sanitizePriceFieldForContext,
  type WineFilterContext,
} from "./wineListUi";
import {
  parseOptionalPositiveNumber,
  WINE_COLOR_ORDER,
  WINE_TABLE_PAGE_SIZE,
  type WineColor,
  type WinePriceFilterField,
  type WineSortKey,
} from "./wineQuery";

export type WineListTab = "collection" | "drank";

export type WineUrlFilterFields = {
  nameQuery: string;
  countryKeys: string[];
  regionKey: string;
  priceField: WinePriceFilterField;
  priceMinStr: string;
  priceMaxStr: string;
  ratingMinStr: string;
};

export type WineUrlSortFields = {
  sortBy: WineSortKey;
  sortDir: "asc" | "desc";
};

type TabScopedState = {
  filters: WineUrlFilterFields;
  sort: WineUrlSortFields;
};

const DRANK_PREFIX = "d_";

function parseTab(searchParams: URLSearchParams): WineListTab {
  return searchParams.get("tab") === "drank" ? "drank" : "collection";
}

function paramKey(base: string, ctx: WineFilterContext): string {
  return ctx === "drank" ? `${DRANK_PREFIX}${base}` : base;
}

function parseCountryKeysForTab(
  searchParams: URLSearchParams,
  ctx: WineFilterContext,
): string[] {
  const key = paramKey("country", ctx);
  const fromAll = searchParams
    .getAll(key)
    .map((c) => c.trim())
    .filter(Boolean);
  if (fromAll.length > 0) return [...new Set(fromAll)];
  const single = (searchParams.get(key) ?? "").trim();
  if (!single) return [];
  if (single.includes(",")) {
    return [...new Set(single.split(",").map((s) => s.trim()).filter(Boolean))];
  }
  return [single];
}

function parsePriceField(
  raw: string | null,
  ctx: WineFilterContext,
): WinePriceFilterField {
  const field =
    raw === "israel" ||
    raw === "origin" ||
    raw === "guestBottle" ||
    raw === "guestGlass"
      ? raw
      : "purchase";
  return sanitizePriceFieldForContext(field, ctx);
}

function parseSortBy(raw: string | null, ctx: WineFilterContext): WineSortKey {
  if (raw && isSortKeyValidForContext(raw, ctx)) return raw;
  return defaultSortForContext(ctx).sortBy;
}

export function parseWineUrlFilters(
  searchParams: URLSearchParams,
  ctx: WineFilterContext = "collection",
): WineUrlFilterFields {
  return {
    nameQuery: (searchParams.get(paramKey("name", ctx)) ?? "").trim(),
    countryKeys: parseCountryKeysForTab(searchParams, ctx),
    regionKey: (searchParams.get(paramKey("region", ctx)) ?? "").trim(),
    priceField: parsePriceField(
      searchParams.get(paramKey("priceField", ctx)),
      ctx,
    ),
    priceMinStr: (searchParams.get(paramKey("priceMin", ctx)) ?? "").trim(),
    priceMaxStr: (searchParams.get(paramKey("priceMax", ctx)) ?? "").trim(),
    ratingMinStr: (searchParams.get(paramKey("ratingMin", ctx)) ?? "").trim(),
  };
}

export function parseWineUrlSort(
  searchParams: URLSearchParams,
  ctx: WineFilterContext = "collection",
): WineUrlSortFields {
  const defaults = defaultSortForContext(ctx);
  const sortByKey = paramKey("sortBy", ctx);
  const sortDirKey = paramKey("sortDir", ctx);
  return {
    sortBy: searchParams.has(sortByKey)
      ? parseSortBy(searchParams.get(sortByKey), ctx)
      : defaults.sortBy,
    sortDir: searchParams.has(sortDirKey)
      ? searchParams.get(sortDirKey) === "asc"
        ? "asc"
        : "desc"
      : defaults.sortDir,
  };
}

function readTabState(
  searchParams: URLSearchParams,
  tab: WineListTab,
): TabScopedState {
  return {
    filters: parseWineUrlFilters(searchParams, tab),
    sort: parseWineUrlSort(searchParams, tab),
  };
}

export function parseHomeUrlState(searchParams: URLSearchParams) {
  const tab = parseTab(searchParams);
  return {
    tab,
    filters: parseWineUrlFilters(searchParams, tab),
    sort: parseWineUrlSort(searchParams, tab),
  };
}

export function parseGuestUrlState(searchParams: URLSearchParams) {
  const filters = parseWineUrlFilters(searchParams, "guest");
  const sort = parseWineUrlSort(searchParams, "guest");
  const limitRaw = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitRaw) && limitRaw >= 1
      ? Math.min(500, Math.round(limitRaw))
      : WINE_TABLE_PAGE_SIZE;
  return { filters, sort, limit };
}

/** Поля для API browse из URL (главная). */
export function homeUrlToBrowseFilters(searchParams: URLSearchParams) {
  const { tab, filters, sort } = parseHomeUrlState(searchParams);
  return {
    drank: tab === "drank",
    nameQuery: filters.nameQuery,
    countryKeys: filters.countryKeys,
    regionKey: filters.regionKey,
    priceField: filters.priceField,
    priceMin: parseOptionalPositiveNumber(filters.priceMinStr),
    priceMax: parseOptionalPositiveNumber(filters.priceMaxStr),
    ratingMin: parseOptionalPositiveNumber(filters.ratingMinStr),
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  };
}

/** Поля для API browse из URL (гости). */
export function guestUrlToBrowseFilters(searchParams: URLSearchParams) {
  const { filters, sort, limit } = parseGuestUrlState(searchParams);
  return {
    drank: false as const,
    nameQuery: filters.nameQuery,
    countryKeys: filters.countryKeys,
    regionKey: filters.regionKey,
    priceField: filters.priceField,
    priceMin: parseOptionalPositiveNumber(filters.priceMinStr),
    priceMax: parseOptionalPositiveNumber(filters.priceMaxStr),
    ratingMin: parseOptionalPositiveNumber(filters.ratingMinStr),
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
    limit,
    offset: 0,
  };
}

type UrlPatch = Partial<
  WineUrlFilterFields &
    WineUrlSortFields & {
      tab: WineListTab;
      limits: Partial<Record<WineColor, number>>;
      limit: number;
    }
>;

function setOrDelete(params: URLSearchParams, key: string, value: string | null) {
  if (value == null || value === "") params.delete(key);
  else params.set(key, value);
}

function clearTabFilterParams(params: URLSearchParams, tab: WineListTab) {
  const keys = [
    "name",
    "region",
    "priceField",
    "priceMin",
    "priceMax",
    "ratingMin",
    "sortBy",
    "sortDir",
  ];
  for (const base of keys) params.delete(paramKey(base, tab));
  params.delete(paramKey("country", tab));
  const countryKey = paramKey("country", tab);
  while (params.has(countryKey)) params.delete(countryKey);
}

function writeFiltersToParams(
  params: URLSearchParams,
  filters: WineUrlFilterFields,
  ctx: WineFilterContext,
) {
  const p = (base: string) => paramKey(base, ctx);
  setOrDelete(params, p("name"), filters.nameQuery || null);
  const countryKey = p("country");
  while (params.has(countryKey)) params.delete(countryKey);
  for (const c of filters.countryKeys) {
    params.append(countryKey, c);
  }
  setOrDelete(params, p("region"), filters.regionKey || null);
  setOrDelete(
    params,
    p("priceField"),
    filters.priceField === "purchase" ? null : filters.priceField,
  );
  setOrDelete(params, p("priceMin"), filters.priceMinStr || null);
  setOrDelete(params, p("priceMax"), filters.priceMaxStr || null);
  setOrDelete(params, p("ratingMin"), filters.ratingMinStr || null);
}

function writeSortToParams(
  params: URLSearchParams,
  sort: WineUrlSortFields,
  ctx: WineFilterContext,
) {
  params.set(paramKey("sortBy", ctx), sort.sortBy);
  params.set(paramKey("sortDir", ctx), sort.sortDir);
}

function clearColorLimits(params: URLSearchParams) {
  for (const color of WINE_COLOR_ORDER) params.delete(`${color}Limit`);
}

function writeAllHomeTabState(
  params: URLSearchParams,
  state: {
    tab: WineListTab;
    collection: TabScopedState;
    drank: TabScopedState;
  },
) {
  clearTabFilterParams(params, "collection");
  clearTabFilterParams(params, "drank");
  writeFiltersToParams(params, state.collection.filters, "collection");
  writeSortToParams(params, state.collection.sort, "collection");
  writeFiltersToParams(params, state.drank.filters, "drank");
  writeSortToParams(params, state.drank.sort, "drank");
  if (state.tab === "drank") params.set("tab", "drank");
  else params.delete("tab");
}

function buildParamsFromPatch(
  current: URLSearchParams,
  patch: UrlPatch,
  options: { clearLimits?: boolean; mode: "home" | "guest" },
): URLSearchParams {
  const params = new URLSearchParams(current.toString());

  if (options.mode === "home") {
    const currentTab = parseTab(current);
    const tab = patch.tab ?? currentTab;
    const collection = readTabState(current, "collection");
    const drank = readTabState(current, "drank");
    const active = tab === "drank" ? drank : collection;

    const nextActive: TabScopedState = {
      filters: { ...active.filters, ...pickFilters(patch) },
      sort: { ...active.sort, ...pickSort(patch) },
    };

    const next = {
      tab,
      collection: tab === "collection" ? nextActive : collection,
      drank: tab === "drank" ? nextActive : drank,
    };

    if (options.clearLimits) clearColorLimits(params);
    writeAllHomeTabState(params, next);
    clearColorLimits(params);
  }

  if (options.mode === "guest") {
    const guest = parseGuestUrlState(current);
    const filters = { ...guest.filters, ...pickFilters(patch) };
    const sort = { ...guest.sort, ...pickSort(patch) };
    let limit = patch.limit ?? guest.limit;

    if (options.clearLimits) {
      limit = WINE_TABLE_PAGE_SIZE;
      params.delete("limit");
    }

    writeFiltersToParams(params, filters, "guest");
    writeSortToParams(params, sort, "guest");
    if (limit > WINE_TABLE_PAGE_SIZE) params.set("limit", String(limit));
    else params.delete("limit");
  }

  return params;
}

function pickFilters(patch: UrlPatch): Partial<WineUrlFilterFields> {
  const out: Partial<WineUrlFilterFields> = {};
  if (patch.nameQuery !== undefined) out.nameQuery = patch.nameQuery;
  if (patch.countryKeys !== undefined) out.countryKeys = patch.countryKeys;
  if (patch.regionKey !== undefined) out.regionKey = patch.regionKey;
  if (patch.priceField !== undefined) out.priceField = patch.priceField;
  if (patch.priceMinStr !== undefined) out.priceMinStr = patch.priceMinStr;
  if (patch.priceMaxStr !== undefined) out.priceMaxStr = patch.priceMaxStr;
  if (patch.ratingMinStr !== undefined) out.ratingMinStr = patch.ratingMinStr;
  return out;
}

function pickSort(patch: UrlPatch): Partial<WineUrlSortFields> {
  const out: Partial<WineUrlSortFields> = {};
  if (patch.sortBy !== undefined) out.sortBy = patch.sortBy;
  if (patch.sortDir !== undefined) out.sortDir = patch.sortDir;
  return out;
}

export type HomeUrlState = ReturnType<typeof parseHomeUrlState>;
export type GuestUrlState = ReturnType<typeof parseGuestUrlState>;

function useWineListUrlInner(mode: "home" | "guest") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state = useMemo(
    () =>
      mode === "home"
        ? parseHomeUrlState(searchParams)
        : parseGuestUrlState(searchParams),
    [mode, searchParams],
  );

  const replaceUrl = useCallback(
    (patch: UrlPatch, options?: { clearLimits?: boolean }) => {
      const next = buildParamsFromPatch(searchParams, patch, {
        clearLimits: options?.clearLimits,
        mode,
      });
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [mode, pathname, router, searchParams],
  );

  const resetFilters = useCallback(() => {
    if (mode !== "home") {
      const params = new URLSearchParams();
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      return;
    }

    const tab = parseTab(searchParams);
    const collection = readTabState(searchParams, "collection");
    const drank = readTabState(searchParams, "drank");
    const cleared = emptyWineUrlFilters(tab);
    const defaultSort = defaultSortForContext(tab);

    const params = new URLSearchParams(searchParams.toString());
    writeAllHomeTabState(params, {
      tab,
      collection:
        tab === "collection"
          ? { filters: cleared, sort: defaultSort }
          : collection,
      drank:
        tab === "drank" ? { filters: cleared, sort: defaultSort } : drank,
    });

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [mode, pathname, router, searchParams]);

  return { state, searchParams, replaceUrl, resetFilters };
}

export function useHomeWineListUrl() {
  const inner = useWineListUrlInner("home");
  return { ...inner, state: inner.state as HomeUrlState };
}

export function useGuestWineListUrl() {
  const inner = useWineListUrlInner("guest");
  return { ...inner, state: inner.state as GuestUrlState };
}
