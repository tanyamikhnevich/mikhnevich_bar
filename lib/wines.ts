"use client";

export const WINE_COLOR_ORDER = ["red", "white", "rose", "sparkling"] as const;
export type WineColor = (typeof WINE_COLOR_ORDER)[number];

export const WINE_COLOR_LABEL: Record<WineColor, string> = {
  red: "Красное",
  white: "Белое",
  rose: "Розовое",
  sparkling: "Игристое",
};

/** Пастельный фон шапки секции таблицы по типу вина */
export const WINE_SECTION_HEADER_CLASS: Record<WineColor, string> = {
  red: "border-b border-rose-200/80 bg-rose-100/95 text-rose-950",
  white: "border-b border-amber-200/70 bg-amber-50/95 text-amber-950",
  rose: "border-b border-pink-200/80 bg-pink-100/95 text-pink-950",
  sparkling: "border-b border-stone-300/70 bg-[#ebe4dc] text-stone-800",
};

export type { WineSortKey } from "./wineQuery";

export type Wine = {
  id: string;
  name: string;
  producer: string;
  year?: string | null;
  country?: string | null;
  countryCode?: string | null;
  region?: string | null;
  subregion?: string | null;
  grape?: string | null;
  ratings?: string | null;
  purchasePrice?: number | null;
  purchaseCurrency?: string | null;
  originPrice?: number | null;
  originCurrency?: string | null;
  israelPrice?: number | null;
  israelCurrency?: string | null;
  guestPrice?: number | null;
  purchaseDate?: string | null;
  vivinoRating?: number | null;
  quantity: number;
  color: WineColor;
  drank: boolean;
  notes?: string | null;
};

export type NewWineInput = Omit<Wine, "id"> & { id?: string };

export { formatWineYear, WINE_VINTAGE_NV } from "./wineVintage";

/** Числа из таблицы (без принудительного $): в Excel разные валюты, в БД — целое. */
export function formatTableAmount(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

export function formatAmountWithCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined,
) {
  const n = formatTableAmount(amount);
  if (n === "—") return "—";
  const sym = (currency ?? "").trim();
  return sym ? `${n}\u00A0${sym}` : n;
}

/** Текст Ratings: из поля или из старых импортов в notes; иначе коротко из Vivino */
export function displayRatings(w: Wine): string {
  const r = (w.ratings ?? "").trim();
  if (r) return r;
  const fromNotes = (w.notes ?? "").match(/Ratings:\s*([^·]+)/);
  if (fromNotes?.[1]?.trim()) return fromNotes[1].trim();
  if (w.vivinoRating != null && Number.isFinite(w.vivinoRating)) {
    return `VV\u00A0${w.vivinoRating.toFixed(1)}`;
  }
  return "";
}

export function formatDateRU(iso: string | null | undefined) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return iso;
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const yy = String(y % 100).padStart(2, "0");
  return `${dd}.${mm}.${yy}`;
}

export function displayNotes(notes: string | null | undefined) {
  if (!notes) return null;
  const cleaned = notes
    .split(" · ")
    .filter((p) => !p.includes("[import:My_Wines.xlsx]"))
    .join(" · ")
    .trim();
  return cleaned || null;
}

