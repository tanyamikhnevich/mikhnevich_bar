import type { WineListTab } from "./wineUrlState";
import type { WinePriceFilterField, WineSortKey } from "./wineQuery";

export type WineFilterContext = WineListTab | "guest";

export const COLLECTION_DEFAULT_SORT = {
  sortBy: "collectionValue" as const,
  sortDir: "desc" as const,
};

export const DRANK_DEFAULT_SORT = {
  sortBy: "drankAt" as const,
  sortDir: "desc" as const,
};

export const GUEST_DEFAULT_SORT = {
  sortBy: "guestBottlePrice" as const,
  sortDir: "desc" as const,
};

export function defaultSortForContext(ctx: WineFilterContext) {
  if (ctx === "drank") return DRANK_DEFAULT_SORT;
  if (ctx === "guest") return GUEST_DEFAULT_SORT;
  return COLLECTION_DEFAULT_SORT;
}

const COLLECTION_PRICE_FIELDS: WinePriceFilterField[] = ["purchase", "israel", "origin"];
const GUEST_PRICE_FIELDS: WinePriceFilterField[] = ["guestBottle", "guestGlass"];

/** Порядок полей цены для фильтра. Подписи берутся из словаря (см. `priceField`). */
export function priceFieldsFor(ctx: WineFilterContext): WinePriceFilterField[] {
  return ctx === "guest" ? GUEST_PRICE_FIELDS : COLLECTION_PRICE_FIELDS;
}

const COLLECTION_SORT_KEYS: WineSortKey[] = [
  "collectionValue",
  "israelPrice",
  "purchasePrice",
  "purchaseDate",
  "vivinoRating",
  "year",
  "name",
];
const DRANK_SORT_KEYS: WineSortKey[] = [
  "drankAt",
  "drankRating",
  "purchasePrice",
  "israelPrice",
  "name",
  "year",
];
const GUEST_SORT_KEYS: WineSortKey[] = [
  "guestBottlePrice",
  "guestGlassPrice",
  "vivinoRating",
  "year",
  "name",
];

export function sanitizePriceFieldForContext(
  field: WinePriceFilterField,
  ctx: WineFilterContext,
): WinePriceFilterField {
  const allowed = priceFieldsFor(ctx);
  if (allowed.includes(field)) return field;
  return allowed[0]!;
}

export function emptyWineUrlFilters(tab: WineFilterContext): {
  nameQuery: string;
  countryKeys: string[];
  regionKey: string;
  priceField: WinePriceFilterField;
  priceMinStr: string;
  priceMaxStr: string;
  ratingMinStr: string;
} {
  return {
    nameQuery: "",
    countryKeys: [],
    regionKey: "",
    priceField: sanitizePriceFieldForContext("purchase", tab),
    priceMinStr: "",
    priceMaxStr: "",
    ratingMinStr: "",
  };
}

export function sortKeysForContext(ctx: WineFilterContext): WineSortKey[] {
  if (ctx === "guest") return GUEST_SORT_KEYS;
  if (ctx === "drank") return DRANK_SORT_KEYS;
  return COLLECTION_SORT_KEYS;
}

export function isSortKeyValidForContext(
  key: string | null,
  ctx: WineFilterContext,
): key is WineSortKey {
  return Boolean(key && sortKeysForContext(ctx).includes(key as WineSortKey));
}
