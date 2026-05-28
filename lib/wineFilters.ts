import type { Wine } from "./wines";

export const WINE_TABLE_PAGE_SIZE = 15;

export type WinePriceFilterField =
  | "purchase"
  | "israel"
  | "origin"
  | "guestBottle"
  | "guestGlass";

export type WineListFilterInput = {
  nameQuery: string;
  countryKey: string;
  priceField: WinePriceFilterField;
  priceMin: number | null;
  priceMax: number | null;
  ratingMin: number | null;
};

export function wineCountryFilterKey(w: Wine): string | null {
  const c = w.country?.trim();
  const code = w.countryCode?.trim();
  return c || code || null;
}

export function sortedCountryFilterOptions(wines: Wine[]): string[] {
  const s = new Set<string>();
  for (const w of wines) {
    const k = wineCountryFilterKey(w);
    if (k) s.add(k);
  }
  return [...s].sort((a, b) => a.localeCompare(b, "ru"));
}

function winePriceByField(w: Wine, field: WinePriceFilterField): number | null {
  switch (field) {
    case "purchase":
      return w.purchasePrice != null && Number.isFinite(w.purchasePrice)
        ? Number(w.purchasePrice)
        : null;
    case "israel":
      return w.israelPrice != null && Number.isFinite(w.israelPrice)
        ? Number(w.israelPrice)
        : null;
    case "origin":
      return w.originPrice != null && Number.isFinite(w.originPrice)
        ? Number(w.originPrice)
        : null;
    case "guestBottle":
      return w.guestBottlePrice != null && Number.isFinite(w.guestBottlePrice)
        ? Number(w.guestBottlePrice)
        : null;
    case "guestGlass":
      return w.guestGlassPrice != null && Number.isFinite(w.guestGlassPrice)
        ? Number(w.guestGlassPrice)
        : null;
  }
}

export function filterWinesByToolbar(items: Wine[], f: WineListFilterInput): Wine[] {
  const q = f.nameQuery.trim().toLowerCase();
  return items.filter((w) => {
    if (q && !w.name.toLowerCase().includes(q)) return false;
    if (f.countryKey) {
      if (wineCountryFilterKey(w) !== f.countryKey) return false;
    }
    const price = winePriceByField(w, f.priceField);
    if (f.priceMin != null) {
      if (price == null) return false;
      if (price < f.priceMin) return false;
    }
    if (f.priceMax != null) {
      if (price == null) return false;
      if (price > f.priceMax) return false;
    }
    if (f.ratingMin != null) {
      if (w.vivinoRating == null || !Number.isFinite(w.vivinoRating)) return false;
      if (w.vivinoRating < f.ratingMin) return false;
    }
    return true;
  });
}

export function parseOptionalPositiveNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
