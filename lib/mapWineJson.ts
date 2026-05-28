export function toWineJson(w: {
  id: string;
  name: string;
  producer: string;
  year: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  subregion: string | null;
  grape: string | null;
  ratings: string | null;
  purchasePrice: number | null;
  purchaseCurrency: string | null;
  originPrice: number | null;
  originCurrency: string | null;
  israelPrice: number | null;
  israelCurrency: string | null;
  guestPrice: number | null;
  purchaseDate: Date | null;
  vivinoRating: number | null;
  quantity: number;
  color: string;
  drank: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: w.id,
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
    guestPrice: w.guestPrice,
    purchaseDate: w.purchaseDate ? w.purchaseDate.toISOString().slice(0, 10) : null,
    vivinoRating: w.vivinoRating,
    quantity: w.quantity,
    color: w.color,
    drank: w.drank,
    notes: w.notes,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}
