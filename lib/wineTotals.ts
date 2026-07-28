import { prisma } from "./prisma";
import { convertAmountToIls, type IlsRates } from "./winePriceIls";

export type WineTotals = {
  collection: number;
  drank: number;
  bottles: number;
  /** Сумма закупки в шекелях (цены в др. валютах пересчитаны по курсу `rates`). */
  value: number;
};

export async function fetchWineTotals(
  userId: string,
  rates?: IlsRates,
): Promise<WineTotals> {
  const [collection, drank, activeRows] = await Promise.all([
    prisma.wine.count({ where: { userId, drank: false } }),
    prisma.wine.count({ where: { userId, drank: true } }),
    prisma.wine.findMany({
      where: { userId, drank: false },
      select: { quantity: true, purchasePrice: true, purchaseCurrency: true },
    }),
  ]);

  let bottles = 0;
  let value = 0;
  for (const w of activeRows) {
    const q = w.quantity > 0 ? w.quantity : 1;
    bottles += q;
    const ils = convertAmountToIls(w.purchasePrice, w.purchaseCurrency, rates) ?? 0;
    value += ils * q;
  }

  return { collection, drank, bottles, value };
}
