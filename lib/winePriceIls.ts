/** Приблизительные курсы к шекелю для сортировки и отображения. */
const TO_ILS: Record<string, number> = {
  "₪": 1,
  ILS: 1,
  $: 3.7,
  USD: 3.7,
  "€": 4,
  EUR: 4,
  "£": 4.6,
  GBP: 4.6,
  "₽": 0.04,
  RUB: 0.04,
};

function currencyKey(symbol: string | null | undefined): string {
  const s = (symbol ?? "").trim().toUpperCase();
  if (!s) return "ILS";
  if (s in TO_ILS) return s;
  if (s.includes("₪") || s.includes("ILS")) return "ILS";
  if (s.includes("$") || s.includes("USD")) return "USD";
  if (s.includes("€") || s.includes("EUR")) return "EUR";
  if (s.includes("£") || s.includes("GBP")) return "GBP";
  if (s.includes("₽") || s.includes("RUB")) return "RUB";
  return s;
}

export function convertAmountToIls(
  amount: number | null | undefined,
  currency: string | null | undefined,
): number | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  const rate = TO_ILS[currencyKey(currency)] ?? 1;
  return Math.round(amount * rate);
}

/** Для сортировки коллекции: цена в Израиле, иначе покупка в ₪. */
export function collectionSortValueIls(wine: {
  israelPrice?: number | null;
  israelCurrency?: string | null;
  purchasePrice?: number | null;
  purchaseCurrency?: string | null;
}): number | null {
  if (wine.israelPrice != null && Number.isFinite(wine.israelPrice)) {
    return wine.israelPrice;
  }
  return convertAmountToIls(wine.purchasePrice, wine.purchaseCurrency);
}
