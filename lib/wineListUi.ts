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

export function priceFieldOptionsFor(ctx: WineFilterContext): {
  value: WinePriceFilterField;
  label: string;
}[] {
  if (ctx === "guest") {
    return [
      { value: "guestBottle", label: "бутылка (гость)" },
      { value: "guestGlass", label: "бокал (гость)" },
    ];
  }
  return [
    { value: "purchase", label: "покупка" },
    { value: "israel", label: "цена в Израиле" },
    { value: "origin", label: "цена (оригинал)" },
  ];
}

export function sortOptionsFor(ctx: WineFilterContext): { value: WineSortKey; label: string }[] {
  if (ctx === "guest") {
    return [
      { value: "guestBottlePrice", label: "цена за бутылку" },
      { value: "guestGlassPrice", label: "цена за бокал" },
      { value: "vivinoRating", label: "рейтинг Vivino" },
      { value: "year", label: "год" },
      { value: "name", label: "название" },
    ];
  }
  if (ctx === "drank") {
    return [
      { value: "drankAt", label: "дата, когда выпили" },
      { value: "drankRating", label: "моя оценка" },
      { value: "purchasePrice", label: "цена покупки" },
      { value: "israelPrice", label: "цена в Израиле" },
      { value: "name", label: "название" },
      { value: "year", label: "год" },
    ];
  }
  return [
    { value: "collectionValue", label: "цена (Израиль / покупка в ₪)" },
    { value: "israelPrice", label: "цена в Израиле" },
    { value: "purchasePrice", label: "цена покупки" },
    { value: "purchaseDate", label: "дата покупки" },
    { value: "vivinoRating", label: "рейтинг Vivino" },
    { value: "year", label: "год" },
    { value: "name", label: "название" },
  ];
}

export function sanitizePriceFieldForContext(
  field: WinePriceFilterField,
  ctx: WineFilterContext,
): WinePriceFilterField {
  const allowed = priceFieldOptionsFor(ctx).map((o) => o.value);
  if (allowed.includes(field)) return field;
  return allowed[0]!;
}

export function ratingFilterLabelFor(ctx: WineFilterContext): string {
  return ctx === "drank" ? "Моя оценка ≥" : "Vivino ≥";
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
  return sortOptionsFor(ctx).map((o) => o.value);
}

export function isSortKeyValidForContext(
  key: string | null,
  ctx: WineFilterContext,
): key is WineSortKey {
  return Boolean(key && sortKeysForContext(ctx).includes(key as WineSortKey));
}
