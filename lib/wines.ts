"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collectionSortValueIls } from "./winePriceIls";
import { compareWineYears } from "./wineUtils";

export const WINE_COLOR_ORDER = ["red", "white", "rose", "sparkling"] as const;
export type WineColor = (typeof WINE_COLOR_ORDER)[number];

/** Пастельный фон шапки секции таблицы по типу вина */
export const WINE_SECTION_HEADER_CLASS: Record<WineColor, string> = {
  red: "border-b border-rose-200/80 bg-rose-100/95 text-rose-950",
  white: "border-b border-amber-200/70 bg-amber-50/95 text-amber-950",
  rose: "border-b border-pink-200/80 bg-pink-100/95 text-pink-950",
  sparkling: "border-b border-stone-300/70 bg-[#ebe4dc] text-stone-800",
};

export type { WineSortKey } from "./wineQuery";
import type { WineSortKey } from "./wineQuery";

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
  isGuestVisible?: boolean;
  guestBottlePrice?: number | null;
  guestGlassPrice?: number | null;
  purchaseDate?: string | null;
  vivinoRating?: number | null;
  quantity: number;
  color: WineColor;
  drank: boolean;
  drankAt?: string | null;
  drankRating?: number | null;
  drankNotes?: string | null;
  notes?: string | null;
};

export type NewWineInput = Omit<Wine, "id"> & { id?: string };

export { formatWineYear, WINE_VINTAGE_NV } from "./wineVintage";
function isWineColor(v: unknown): v is WineColor {
  return (
    v === "red" ||
    v === "white" ||
    v === "rose" ||
    v === "sparkling"
  );
}

function normalizeWine(raw: Partial<Wine> & { name: string; producer: string }): Wine {
  const qty =
    typeof raw.quantity === "number" && raw.quantity > 0 ? Math.round(raw.quantity) : 1;
  const color: WineColor = isWineColor(raw.color) ? raw.color : "red";
  return {
    id: String(raw.id ?? ""),
    name: raw.name,
    producer: raw.producer,
    year:
      raw.year === null || raw.year === undefined || raw.year === ""
        ? null
        : String(raw.year),
    country: raw.country ?? null,
    countryCode: raw.countryCode ?? null,
    region: raw.region ?? null,
    subregion: raw.subregion ?? null,
    grape: raw.grape ?? null,
    ratings: raw.ratings ?? null,
    purchasePrice: raw.purchasePrice ?? null,
    purchaseCurrency: raw.purchaseCurrency ?? null,
    originPrice: raw.originPrice ?? null,
    originCurrency: raw.originCurrency ?? null,
    israelPrice: raw.israelPrice ?? null,
    israelCurrency: raw.israelCurrency ?? null,
    isGuestVisible: Boolean(raw.isGuestVisible),
    guestBottlePrice: raw.guestBottlePrice ?? null,
    guestGlassPrice: raw.guestGlassPrice ?? null,
    purchaseDate: raw.purchaseDate ?? null,
    vivinoRating: raw.vivinoRating ?? null,
    quantity: qty,
    color,
    drank: Boolean(raw.drank),
    drankAt: raw.drankAt ?? null,
    drankRating: raw.drankRating ?? null,
    drankNotes: raw.drankNotes ?? null,
    notes: raw.notes ?? null,
  };
}

export function groupWinesByColor(items: Wine[]): Record<WineColor, Wine[]> {
  const groups: Record<WineColor, Wine[]> = {
    red: [],
    white: [],
    rose: [],
    sparkling: [],
  };
  for (const w of items) {
    const c: WineColor = isWineColor(w.color) ? w.color : "red";
    groups[c].push(w);
  }
  return groups;
}

function purchaseDateMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

export function sortWines(
  items: Wine[],
  key: WineSortKey,
  dir: "asc" | "desc",
): Wine[] {
  const m = dir === "asc" ? 1 : -1;

  const cmpNum = (a: number | null | undefined, b: number | null | undefined) => {
    const na = a != null && Number.isFinite(a) ? Number(a) : null;
    const nb = b != null && Number.isFinite(b) ? Number(b) : null;
    if (na == null && nb == null) return 0;
    if (na == null) return 1;
    if (nb == null) return -1;
    return na - nb;
  };

  return [...items].sort((a, b) => {
    let c = 0;
    switch (key) {
      case "purchaseDate": {
        const ta = purchaseDateMs(a.purchaseDate);
        const tb = purchaseDateMs(b.purchaseDate);
        c = cmpNum(ta, tb);
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      }
      case "purchasePrice":
        c = cmpNum(a.purchasePrice, b.purchasePrice);
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      case "israelPrice":
        c = cmpNum(a.israelPrice, b.israelPrice);
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      case "originPrice":
        c = cmpNum(a.originPrice, b.originPrice);
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      case "guestBottlePrice":
        c = cmpNum(a.guestBottlePrice, b.guestBottlePrice);
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      case "guestGlassPrice":
        c = cmpNum(a.guestGlassPrice, b.guestGlassPrice);
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      case "vivinoRating":
        c = cmpNum(a.vivinoRating, b.vivinoRating);
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      case "drankAt": {
        const ta = a.drankAt ? new Date(a.drankAt).getTime() : null;
        const tb = b.drankAt ? new Date(b.drankAt).getTime() : null;
        c = cmpNum(ta, tb);
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      }
      case "drankRating":
        c = cmpNum(a.drankRating, b.drankRating);
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      case "collectionValue":
        c = cmpNum(collectionSortValueIls(a), collectionSortValueIls(b));
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      case "year":
        c = compareWineYears(a.year, b.year);
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      case "name":
        c = a.name.localeCompare(b.name, "ru");
        break;
    }
    return c * m;
  });
}

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

export function computeTotals(wines: Wine[]) {
  const active = wines.filter((w) => !w.drank);
  const drankList = wines.filter((w) => w.drank);
  const bottles = active.reduce((acc, w) => acc + (w.quantity || 0), 0);
  const value = active.reduce(
    (acc, w) => acc + (w.purchasePrice || 0) * (w.quantity || 1),
    0,
  );
  return {
    collection: active.length,
    drank: drankList.length,
    bottles,
    value,
  };
}

async function parseErrorMessage(res: Response) {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export function useWines() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/wines", { cache: "no-store" });
    if (!res.ok) throw new Error(await parseErrorMessage(res));
    const data = (await res.json()) as Wine[];
    setWines(data.map((w) => normalizeWine(w)));
    setError(null);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh()
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
        .finally(() => setLoading(false));
    });
  }, [refresh]);

  const totals = useMemo(() => computeTotals(wines), [wines]);

  const addWine = useCallback(
    async (input: NewWineInput) => {
      const res = await fetch("/api/wines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          producer: input.producer,
          year: input.year,
          country: input.country || null,
          countryCode: input.countryCode || null,
          region: input.region || null,
          subregion: input.subregion || null,
          grape: input.grape || null,
          ratings: input.ratings || null,
          purchasePrice: input.purchasePrice,
          purchaseCurrency: input.purchaseCurrency || null,
          originPrice: input.originPrice,
          originCurrency: input.originCurrency || null,
          israelPrice: input.israelPrice,
          israelCurrency: input.israelCurrency || null,
          isGuestVisible: Boolean(input.isGuestVisible),
          guestBottlePrice: input.guestBottlePrice ?? null,
          guestGlassPrice: input.guestGlassPrice ?? null,
          purchaseDate: input.purchaseDate || null,
          vivinoRating: input.vivinoRating ?? null,
          quantity: input.quantity ?? 1,
          color: input.color,
          drank: Boolean(input.drank),
          notes: input.notes || null,
        }),
      });
      if (!res.ok) throw new Error(await parseErrorMessage(res));
      await refresh();
    },
    [refresh],
  );

  const updateWine = useCallback(
    async (id: string, patch: Partial<Wine>) => {
      const res = await fetch(`/api/wines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await parseErrorMessage(res));
      await refresh();
    },
    [refresh],
  );

  const saveGuestMenu = useCallback(
    async (items: import("./guestWineApi").GuestWineUpdate[]) => {
      const res = await fetch("/api/wines/guest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          wineIds?: string[];
        };
        const err = new Error(j.error ?? res.statusText) as Error & { wineIds?: string[] };
        err.wineIds = j.wineIds;
        throw err;
      }
      await refresh();
    },
    [refresh],
  );

  return { wines, loading, error, refresh, addWine, updateWine, saveGuestMenu, totals };
}

export function useGuestWines() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/wines/guest", { cache: "no-store" });
    if (!res.ok) throw new Error(await parseErrorMessage(res));
    const data = (await res.json()) as Wine[];
    setWines(data.map((w) => normalizeWine(w)));
    setError(null);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh()
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
        .finally(() => setLoading(false));
    });
  }, [refresh]);

  return { wines, loading, error, refresh };
}

export function isGuestListWine(w: Wine): boolean {
  return Boolean(w.isGuestVisible) && w.quantity > 0 && !w.drank;
}
