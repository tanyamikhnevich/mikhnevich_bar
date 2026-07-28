import { convertAmountToIls, type IlsRates } from "./winePriceIls";
import { WINE_COLOR_ORDER, type WineColor } from "./wineQuery";

/** Строка выпитого вина, нужная для подсчёта сводки (минимальный набор полей). */
export type DrankStatsRow = {
  purchasePrice: number | null;
  purchaseCurrency: string | null;
  israelPrice: number | null;
  israelCurrency: string | null;
  quantity: number;
  country: string | null;
  color: string;
  drankAt: Date | string | null;
  name: string;
};

export type DrankStats = {
  /** Бутылок в периоде (Σ количество). */
  bottles: number;
  /** Позиций (строк вина) в периоде. */
  wines: number;
  /** Потрачено — сумма цен покупки × количество, в ₪. */
  spentIls: number;
  /** Медиана цены покупки за бутылку, ₪ (по винам с ценой; null, если таких нет). */
  medianPerBottleIls: number | null;
  /** Медиана цены в Израиле, ₪ (по винам с этой ценой; null, если таких нет). */
  medianIsraelIls: number | null;
  /** Бутылок по цвету. */
  byColor: Record<WineColor, number>;
  /** Страна с наибольшим числом бутылок. */
  topCountry: { country: string; bottles: number } | null;
  /** Самое дорогое выпитое вино (цена покупки за бутылку в ₪). */
  mostExpensive: { name: string; ils: number } | null;
  /** Бутылок без даты «когда выпили» — не попали в период (только когда период задан). */
  noDateBottles: number;
};

/** Медиана списка чисел (округлённая), либо null для пустого списка. */
function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 1
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(value);
}

export type DrankPeriodRange = {
  /** Включительно, начало периода (или null — без нижней границы). */
  from: Date | null;
  /** Исключительно, конец периода (или null — без верхней границы). */
  to: Date | null;
};

function toDate(value: Date | string | null): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isColor(value: string): value is WineColor {
  return (WINE_COLOR_ORDER as readonly string[]).includes(value);
}

export function computeDrankStats(
  rows: DrankStatsRow[],
  rates: IlsRates | undefined,
  range: DrankPeriodRange,
): DrankStats {
  const hasPeriod = range.from != null || range.to != null;

  const byColor: Record<WineColor, number> = {
    red: 0,
    white: 0,
    rose: 0,
    sparkling: 0,
  };
  const byCountry = new Map<string, number>();

  let bottles = 0;
  let wines = 0;
  let spentIls = 0;
  let noDateBottles = 0;
  let mostExpensive: { name: string; ils: number } | null = null;
  // Медианы считаем по бутылкам: цена каждой бутылки повторяется `qty` раз.
  const purchasePerBottle: number[] = [];
  const israelPerBottle: number[] = [];

  for (const row of rows) {
    const qty = row.quantity > 0 ? row.quantity : 1;
    const drankAt = toDate(row.drankAt);

    if (hasPeriod) {
      if (!drankAt) {
        noDateBottles += qty;
        continue;
      }
      if (range.from && drankAt < range.from) continue;
      if (range.to && drankAt >= range.to) continue;
    }

    bottles += qty;
    wines += 1;

    const perBottleIls = convertAmountToIls(
      row.purchasePrice,
      row.purchaseCurrency,
      rates,
    );
    if (perBottleIls != null) {
      spentIls += perBottleIls * qty;
      for (let i = 0; i < qty; i++) purchasePerBottle.push(perBottleIls);
      if (!mostExpensive || perBottleIls > mostExpensive.ils) {
        mostExpensive = { name: row.name, ils: perBottleIls };
      }
    }

    const israelIls = convertAmountToIls(
      row.israelPrice,
      row.israelCurrency,
      rates,
    );
    if (israelIls != null) {
      for (let i = 0; i < qty; i++) israelPerBottle.push(israelIls);
    }

    if (isColor(row.color)) byColor[row.color] += qty;

    const country = row.country?.trim();
    if (country) byCountry.set(country, (byCountry.get(country) ?? 0) + qty);
  }

  let topCountry: { country: string; bottles: number } | null = null;
  for (const [country, count] of byCountry) {
    if (!topCountry || count > topCountry.bottles) {
      topCountry = { country, bottles: count };
    }
  }

  return {
    bottles,
    wines,
    spentIls,
    medianPerBottleIls: median(purchasePerBottle),
    medianIsraelIls: median(israelPerBottle),
    byColor,
    topCountry,
    mostExpensive,
    noDateBottles,
  };
}
