"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseColorLimits,
  parseCountryKeysFromSearchParams,
  parseOptionalPositiveNumber,
  WINE_COLOR_ORDER,
  WINE_TABLE_PAGE_SIZE,
  DEFAULT_WINE_SORT_BY,
  DEFAULT_WINE_SORT_DIR,
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

const SORT_KEYS: WineSortKey[] = [
  "purchaseDate",
  "purchasePrice",
  "israelPrice",
  "originPrice",
  "vivinoRating",
  "name",
  "year",
];

function parseTab(searchParams: URLSearchParams): WineListTab {
  return searchParams.get("tab") === "drank" ? "drank" : "collection";
}

function parsePriceField(raw: string | null): WinePriceFilterField {
  return raw === "israel" || raw === "origin" ? raw : "purchase";
}

function parseSortBy(raw: string | null): WineSortKey {
  if (raw === "none") return DEFAULT_WINE_SORT_BY;
  return SORT_KEYS.includes(raw as WineSortKey)
    ? (raw as WineSortKey)
    : DEFAULT_WINE_SORT_BY;
}

export function parseWineUrlFilters(
  searchParams: URLSearchParams,
): WineUrlFilterFields {
  return {
    nameQuery: (searchParams.get("name") ?? "").trim(),
    countryKeys: parseCountryKeysFromSearchParams(searchParams),
    regionKey: (searchParams.get("region") ?? "").trim(),
    priceField: parsePriceField(searchParams.get("priceField")),
    priceMinStr: (searchParams.get("priceMin") ?? "").trim(),
    priceMaxStr: (searchParams.get("priceMax") ?? "").trim(),
    ratingMinStr: (searchParams.get("ratingMin") ?? "").trim(),
  };
}

export function parseWineUrlSort(searchParams: URLSearchParams): WineUrlSortFields {
  return {
    sortBy: parseSortBy(searchParams.get("sortBy")),
    sortDir:
      searchParams.get("sortDir") === "asc" ? "asc" : DEFAULT_WINE_SORT_DIR,
  };
}

export function parseHomeUrlState(searchParams: URLSearchParams) {
  const tab = parseTab(searchParams);
  const filters = parseWineUrlFilters(searchParams);
  const sort = parseWineUrlSort(searchParams);
  const limits = parseColorLimits(searchParams);
  return { tab, filters, sort, limits };
}

export function parseGuestUrlState(searchParams: URLSearchParams) {
  const filters = parseWineUrlFilters(searchParams);
  const sort = parseWineUrlSort(searchParams);
  const limitRaw = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitRaw) && limitRaw >= 1
      ? Math.min(500, Math.round(limitRaw))
      : WINE_TABLE_PAGE_SIZE;
  return { filters, sort, limit };
}

/** Поля для API browse из URL (главная). */
export function homeUrlToBrowseFilters(
  searchParams: URLSearchParams,
) {
  const { tab, filters, sort, limits } = parseHomeUrlState(searchParams);
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
    limits,
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

function writeFiltersToParams(
  params: URLSearchParams,
  filters: WineUrlFilterFields,
) {
  setOrDelete(params, "name", filters.nameQuery || null);
  params.delete("country");
  for (const c of filters.countryKeys) {
    params.append("country", c);
  }
  setOrDelete(params, "region", filters.regionKey || null);
  setOrDelete(params, "priceField", filters.priceField === "purchase" ? null : filters.priceField);
  setOrDelete(params, "priceMin", filters.priceMinStr || null);
  setOrDelete(params, "priceMax", filters.priceMaxStr || null);
  setOrDelete(params, "ratingMin", filters.ratingMinStr || null);
}

function writeSortToParams(params: URLSearchParams, sort: WineUrlSortFields) {
  params.set("sortBy", sort.sortBy);
  params.set("sortDir", sort.sortDir);
}

function clearColorLimits(params: URLSearchParams) {
  for (const color of WINE_COLOR_ORDER) params.delete(`${color}Limit`);
}

function writeColorLimits(
  params: URLSearchParams,
  limits: Partial<Record<WineColor, number>>,
) {
  for (const color of WINE_COLOR_ORDER) {
    const n = limits[color];
    if (n == null || n <= WINE_TABLE_PAGE_SIZE) {
      params.delete(`${color}Limit`);
    } else {
      params.set(`${color}Limit`, String(Math.min(500, Math.round(n))));
    }
  }
}

function buildParamsFromPatch(
  current: URLSearchParams,
  patch: UrlPatch,
  options: { clearLimits?: boolean; mode: "home" | "guest" },
): URLSearchParams {
  const home = options.mode === "home" ? parseHomeUrlState(current) : null;
  const guest = options.mode === "guest" ? parseGuestUrlState(current) : null;

  const params = new URLSearchParams(current.toString());

  if (options.mode === "home" && home) {
    const tab = patch.tab ?? home.tab;
    const filters = { ...home.filters, ...pickFilters(patch) };
    const sort = { ...home.sort, ...pickSort(patch) };
    let limits = { ...home.limits, ...pickLimits(patch) };

    if (options.clearLimits) {
      limits = pickLimits(patch);
      clearColorLimits(params);
    }

    if (tab === "collection") params.delete("tab");
    else params.set("tab", "drank");

    writeFiltersToParams(params, filters);
    writeSortToParams(params, sort);
    writeColorLimits(params, limits);
  }

  if (options.mode === "guest" && guest) {
    const filters = { ...guest.filters, ...pickFilters(patch) };
    const sort = { ...guest.sort, ...pickSort(patch) };
    let limit = patch.limit ?? guest.limit;

    if (options.clearLimits) {
      limit = WINE_TABLE_PAGE_SIZE;
      params.delete("limit");
    }

    writeFiltersToParams(params, filters);
    writeSortToParams(params, sort);
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

function pickLimits(patch: UrlPatch): Partial<Record<WineColor, number>> {
  return patch.limits ?? {};
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
    const params = new URLSearchParams();
    if (mode === "home" && "tab" in state && state.tab === "drank") {
      params.set("tab", "drank");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [mode, pathname, router, state]);

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
