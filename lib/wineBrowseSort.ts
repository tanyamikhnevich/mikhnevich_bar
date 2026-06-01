import type { Wine } from "./generated/prisma/client";
import { collectionSortValueIls } from "./winePriceIls";
import type { WineSortKey } from "./wineQuery";

export function needsMemorySort(sortBy: WineSortKey): boolean {
  return sortBy === "collectionValue";
}

function cmpNum(
  a: number | null | undefined,
  b: number | null | undefined,
): number {
  const na = a != null && Number.isFinite(a) ? a : null;
  const nb = b != null && Number.isFinite(b) ? b : null;
  if (na == null && nb == null) return 0;
  if (na == null) return 1;
  if (nb == null) return -1;
  return na - nb;
}

function cmpDate(a: Date | null | undefined, b: Date | null | undefined): number {
  const ta = a ? a.getTime() : null;
  const tb = b ? b.getTime() : null;
  return cmpNum(ta, tb);
}

export function sortWineRowsInMemory<T extends Wine>(
  rows: T[],
  sortBy: WineSortKey,
  sortDir: "asc" | "desc",
): T[] {
  const m = sortDir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let c = 0;
    switch (sortBy) {
      case "collectionValue":
        c = cmpNum(collectionSortValueIls(a), collectionSortValueIls(b));
        if (c === 0) c = a.name.localeCompare(b.name, "ru");
        break;
      default:
        return 0;
    }
    return c * m;
  });
}
