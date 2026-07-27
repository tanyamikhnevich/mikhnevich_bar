import { prisma } from "./prisma";

export type WineTotals = {
  collection: number;
  drank: number;
  bottles: number;
  value: number;
};

export async function fetchWineTotals(userId: string): Promise<WineTotals> {
  const [collection, drank, activeRows] = await Promise.all([
    prisma.wine.count({ where: { userId, drank: false } }),
    prisma.wine.count({ where: { userId, drank: true } }),
    prisma.wine.findMany({
      where: { userId, drank: false },
      select: { quantity: true, purchasePrice: true },
    }),
  ]);

  let bottles = 0;
  let value = 0;
  for (const w of activeRows) {
    const q = w.quantity > 0 ? w.quantity : 1;
    bottles += q;
    value += (w.purchasePrice ?? 0) * q;
  }

  return { collection, drank, bottles, value };
}
