"use client";

import type { GuestWineUpdate } from "./guestWineApi";
import type { NewWineInput, Wine } from "./wines";
import { appendBrowseParams, type WineBrowseFilters } from "./wineQuery";

async function parseErrorMessage(res: Response) {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function addWineApi(input: NewWineInput): Promise<void> {
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
}

export type DrinkApiResponse = {
  mode: "moved" | "split";
  active: Wine;
  drank: Wine;
};

export type DrinkWineInput = {
  quantity?: number;
  drankRating?: number | null;
  drankNotes?: string | null;
};

export async function drinkWineApi(
  id: string,
  input: number | DrinkWineInput = 1,
): Promise<DrinkApiResponse> {
  const body =
    typeof input === "number"
      ? { quantity: input }
      : {
          quantity: input.quantity ?? 1,
          ...(input.drankRating != null ? { drankRating: input.drankRating } : {}),
          ...(input.drankNotes != null && input.drankNotes !== ""
            ? { drankNotes: input.drankNotes }
            : {}),
        };
  const res = await fetch(`/api/wines/${id}/drink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return (await res.json()) as DrinkApiResponse;
}

export async function restoreWineApi(id: string): Promise<void> {
  const res = await fetch(`/api/wines/${id}/restore`, { method: "POST" });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}

export async function updateWineApi(
  id: string,
  patch: Record<string, unknown>,
): Promise<Wine> {
  const res = await fetch(`/api/wines/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return (await res.json()) as Wine;
}

export async function deleteWineApi(id: string): Promise<void> {
  const res = await fetch(`/api/wines/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}

export async function fetchCollectionWinesApi(): Promise<Wine[]> {
  const res = await fetch("/api/wines", { cache: "no-store" });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  const data = (await res.json()) as Wine[];
  return data.filter((w) => !w.drank);
}

/** Все выпитые вина под текущими фильтрами — для режима ручного подсчёта. */
export async function fetchDrankWinesApi(
  filters: WineBrowseFilters,
): Promise<Wine[]> {
  const sp = new URLSearchParams();
  sp.set("flat", "1");
  appendBrowseParams(sp, { ...filters, drank: true });
  sp.set("limit", "500");
  sp.set("offset", "0");
  const res = await fetch(`/api/wines/browse?${sp.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  const json = (await res.json()) as { items: Wine[] };
  return json.items ?? [];
}

export async function saveGuestMenuApi(items: GuestWineUpdate[]): Promise<void> {
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
}
