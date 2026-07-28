/** Курсы валют к шекелю: код валюты -> сколько ₪ за 1 единицу. */
export type IlsRates = Record<string, number>;

/** Приблизительный фолбэк, если живой курс недоступен. */
export const FALLBACK_ILS_RATES: IlsRates = {
  ILS: 1,
  USD: 3.7,
  EUR: 4,
  GBP: 4.6,
  RUB: 0.04,
};

/** Символ/код валюты -> нормализованный код (ILS/USD/EUR/GBP/RUB…). */
function currencyKey(symbol: string | null | undefined): string {
  const s = (symbol ?? "").trim().toUpperCase();
  if (!s) return "ILS";
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
  rates?: IlsRates,
): number | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  const key = currencyKey(currency);
  const rate = rates?.[key] ?? FALLBACK_ILS_RATES[key] ?? 1;
  return Math.round(amount * rate);
}

/** Для сортировки коллекции: цена в Израиле, иначе покупка в ₪. */
export function collectionSortValueIls(
  wine: {
    israelPrice?: number | null;
    israelCurrency?: string | null;
    purchasePrice?: number | null;
    purchaseCurrency?: string | null;
  },
  rates?: IlsRates,
): number | null {
  if (wine.israelPrice != null && Number.isFinite(wine.israelPrice)) {
    return wine.israelPrice;
  }
  return convertAmountToIls(wine.purchasePrice, wine.purchaseCurrency, rates);
}
