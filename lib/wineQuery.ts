import type { Prisma } from "./generated/prisma/client";
export const WINE_TABLE_PAGE_SIZE = 20;

export const WINE_COLOR_ORDER = ["red", "white", "rose", "sparkling"] as const;
export type WineColor = (typeof WINE_COLOR_ORDER)[number];

export type WinePriceFilterField =
  | "purchase"
  | "israel"
  | "origin"
  | "guestBottle"
  | "guestGlass";

export type WineSortKey =
  | "purchaseDate"
  | "purchasePrice"
  | "israelPrice"
  | "originPrice"
  | "guestBottlePrice"
  | "guestGlassPrice"
  | "vivinoRating"
  | "collectionValue"
  | "drankAt"
  | "drankRating"
  | "name"
  | "year";

export const DEFAULT_WINE_SORT_BY: WineSortKey = "purchasePrice";
export const DEFAULT_WINE_SORT_DIR: "asc" | "desc" = "desc";

export type WineBrowseFilters = {
  drank: boolean;
  nameQuery: string;
  countryKeys: string[];
  regionKey: string;
  priceField: WinePriceFilterField;
  priceMin: number | null;
  priceMax: number | null;
  ratingMin: number | null;
  sortBy: WineSortKey;
  sortDir: "asc" | "desc";
};

function isWineColor(v: string): v is WineColor {
  return (
    v === "red" || v === "white" || v === "rose" || v === "sparkling"
  );
}

/** Параметр `country` в URL может повторяться: ?country=France&country=Italy */
export function parseCountryKeysFromSearchParams(
  searchParams: URLSearchParams,
): string[] {
  const fromAll = searchParams
    .getAll("country")
    .map((c) => c.trim())
    .filter(Boolean);
  if (fromAll.length > 0) {
    return [...new Set(fromAll)];
  }
  const single = (searchParams.get("country") ?? "").trim();
  if (!single) return [];
  if (single.includes(",")) {
    return [...new Set(single.split(",").map((s) => s.trim()).filter(Boolean))];
  }
  return [single];
}

export function parseOptionalPositiveNumber(raw: string | null | undefined): number | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function parseWineBrowseFilters(
  searchParams: URLSearchParams,
): WineBrowseFilters {
  const drankRaw = searchParams.get("drank");
  const drank = drankRaw === "true";

  const priceFieldRaw = searchParams.get("priceField");
  const priceField: WinePriceFilterField =
    priceFieldRaw === "israel" ||
    priceFieldRaw === "origin" ||
    priceFieldRaw === "guestBottle" ||
    priceFieldRaw === "guestGlass"
      ? priceFieldRaw
      : "purchase";

  const sortByRaw = searchParams.get("sortBy");
  const sortKeys: WineSortKey[] = [
    "purchaseDate",
    "purchasePrice",
    "israelPrice",
    "originPrice",
    "guestBottlePrice",
    "guestGlassPrice",
    "vivinoRating",
    "collectionValue",
    "drankAt",
    "drankRating",
    "name",
    "year",
  ];
  const sortBy =
    sortByRaw && sortKeys.includes(sortByRaw as WineSortKey)
      ? (sortByRaw as WineSortKey)
      : DEFAULT_WINE_SORT_BY;

  const sortDir =
    searchParams.get("sortDir") === "asc" ? "asc" : DEFAULT_WINE_SORT_DIR;

  return {
    drank,
    nameQuery: (searchParams.get("name") ?? "").trim(),
    countryKeys: parseCountryKeysFromSearchParams(searchParams),
    regionKey: (searchParams.get("region") ?? "").trim(),
    priceField,
    priceMin: parseOptionalPositiveNumber(searchParams.get("priceMin")),
    priceMax: parseOptionalPositiveNumber(searchParams.get("priceMax")),
    ratingMin: parseOptionalPositiveNumber(searchParams.get("ratingMin")),
    sortBy,
    sortDir,
  };
}

export function parseColorLimits(
  searchParams: URLSearchParams,
): Partial<Record<WineColor, number>> {
  const out: Partial<Record<WineColor, number>> = {};
  for (const color of WINE_COLOR_ORDER) {
    const raw = searchParams.get(`${color}Limit`);
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) continue;
    out[color] = Math.min(500, Math.round(n));
  }
  return out;
}

export function parseFlatPagination(searchParams: URLSearchParams): {
  limit: number;
  offset: number;
} {
  const limitRaw = Number(searchParams.get("limit"));
  const offsetRaw = Number(searchParams.get("offset"));
  const limit =
    Number.isFinite(limitRaw) && limitRaw >= 1
      ? Math.min(500, Math.round(limitRaw))
      : WINE_TABLE_PAGE_SIZE;
  const offset =
    Number.isFinite(offsetRaw) && offsetRaw >= 0 ? Math.round(offsetRaw) : 0;
  return { limit, offset };
}

function priceFieldColumn(
  field: WinePriceFilterField,
):
  | "purchasePrice"
  | "israelPrice"
  | "originPrice"
  | "guestBottlePrice"
  | "guestGlassPrice" {
  switch (field) {
    case "israel":
      return "israelPrice";
    case "origin":
      return "originPrice";
    case "guestBottle":
      return "guestBottlePrice";
    case "guestGlass":
      return "guestGlassPrice";
    default:
      return "purchasePrice";
  }
}

export function buildWineBrowseWhere(
  filters: WineBrowseFilters,
  color?: WineColor,
): Prisma.WineWhereInput {
  const where: Prisma.WineWhereInput = { drank: filters.drank };

  if (color) where.color = color;

  if (filters.nameQuery) {
    where.OR = [
      { name: { contains: filters.nameQuery, mode: "insensitive" } },
      { producer: { contains: filters.nameQuery, mode: "insensitive" } },
    ];
  }

  if (filters.countryKeys.length === 1) {
    where.country = filters.countryKeys[0];
  } else if (filters.countryKeys.length > 1) {
    where.country = { in: filters.countryKeys };
  }

  if (filters.regionKey) {
    where.region = filters.regionKey;
  }

  const and: Prisma.WineWhereInput[] = [];

  const priceCol = priceFieldColumn(filters.priceField);
  if (filters.priceMin != null || filters.priceMax != null) {
    const range: Prisma.IntNullableFilter = { not: null };
    if (filters.priceMin != null) range.gte = Math.round(filters.priceMin);
    if (filters.priceMax != null) range.lte = Math.round(filters.priceMax);
    and.push({ [priceCol]: range });
  }

  if (filters.ratingMin != null) {
    if (filters.drank) {
      and.push({
        drankRating: { not: null, gte: filters.ratingMin },
      });
    } else {
      and.push({
        vivinoRating: { not: null, gte: filters.ratingMin },
      });
    }
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

function nullableSort(
  field:
    | "purchasePrice"
    | "israelPrice"
    | "originPrice"
    | "guestBottlePrice"
    | "guestGlassPrice"
    | "vivinoRating"
    | "drankRating"
    | "year",
  dir: "asc" | "desc",
): Prisma.WineOrderByWithRelationInput {
  return { [field]: { sort: dir, nulls: "last" } };
}

export function buildWineOrderBy(
  sortBy: WineSortKey,
  sortDir: "asc" | "desc",
): Prisma.WineOrderByWithRelationInput[] {
  const dir = sortDir;
  const tie = { name: dir as Prisma.SortOrder };

  switch (sortBy) {
    case "purchaseDate":
      return [{ purchaseDate: { sort: dir, nulls: "last" } }, tie];
    case "purchasePrice":
      return [nullableSort("purchasePrice", dir), tie];
    case "israelPrice":
      return [nullableSort("israelPrice", dir), tie];
    case "originPrice":
      return [nullableSort("originPrice", dir), tie];
    case "guestBottlePrice":
      return [nullableSort("guestBottlePrice", dir), tie];
    case "guestGlassPrice":
      return [nullableSort("guestGlassPrice", dir), tie];
    case "vivinoRating":
      return [nullableSort("vivinoRating", dir), tie];
    case "drankAt":
      return [{ drankAt: { sort: dir, nulls: "last" } }, tie];
    case "drankRating":
      return [nullableSort("drankRating", dir), tie];
    case "year":
      return [nullableSort("year", dir), tie];
    case "name":
      return [{ name: dir }];
    case "collectionValue":
      return [nullableSort("israelPrice", dir), tie];
    default:
      return [
        nullableSort("purchasePrice", DEFAULT_WINE_SORT_DIR),
        tie,
      ];
  }
}

export function appendBrowseParams(
  params: URLSearchParams,
  filters: WineBrowseFilters,
): void {
  params.set("drank", String(filters.drank));
  if (filters.nameQuery) params.set("name", filters.nameQuery);
  params.delete("country");
  for (const c of filters.countryKeys) {
    params.append("country", c);
  }
  if (filters.regionKey) params.set("region", filters.regionKey);
  params.set("priceField", filters.priceField);
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  if (filters.ratingMin != null) params.set("ratingMin", String(filters.ratingMin));
  params.set("sortBy", filters.sortBy);
  params.set("sortDir", filters.sortDir);
}

export function isWineColorValue(v: string): v is WineColor {
  return isWineColor(v);
}
