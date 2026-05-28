import type { Wine } from "./generated/prisma/client";

/** Поля вина для создания дубликата (без id и timestamps). */
export function wineDuplicateCreateData(
  w: Wine,
  opts: { quantity: number; drank: boolean },
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
