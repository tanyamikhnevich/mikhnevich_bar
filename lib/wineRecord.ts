import type { Wine } from "./generated/prisma/client";

/** Поля вина для создания дубликата (без id и timestamps). */
export function wineDuplicateCreateData(
  w: Wine,
  opts: {
    quantity: number;
    drank: boolean;
    drankAt?: Date | null;
    drankRating?: number | null;
    drankNotes?: string | null;
  },
) {
  return {
    name: w.name,
    producer: w.producer,
    year: w.year,
    country: w.country,
    countryCode: w.countryCode,
    region: w.region,
    subregion: w.subregion,
    grape: w.grape,
    ratings: w.ratings,
    purchasePrice: w.purchasePrice,
    purchaseCurrency: w.purchaseCurrency,
    originPrice: w.originPrice,
    originCurrency: w.originCurrency,
    israelPrice: w.israelPrice,
    israelCurrency: w.israelCurrency,
    isGuestVisible: w.isGuestVisible,
    guestBottlePrice: w.guestBottlePrice,
    guestGlassPrice: w.guestGlassPrice,
    purchaseDate: w.purchaseDate,
    vivinoRating: w.vivinoRating,
    quantity: opts.quantity,
    color: w.color,
    drank: opts.drank,
    drankAt: opts.drank ? (opts.drankAt ?? new Date()) : null,
    drankRating: opts.drank ? (opts.drankRating ?? null) : null,
    drankNotes: opts.drank ? (opts.drankNotes ?? null) : null,
    notes: w.notes,
  };
}

export function wineIdentityWhere(w: Wine) {
  return {
    name: w.name,
    producer: w.producer,
    year: w.year,
    color: w.color,
  };
}
