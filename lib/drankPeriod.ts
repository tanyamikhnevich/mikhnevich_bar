export type DrankPeriodKey = "thisMonth" | "lastMonth" | "thisYear" | "all";

export const DRANK_PERIODS: DrankPeriodKey[] = [
  "thisMonth",
  "lastMonth",
  "thisYear",
  "all",
];

export const DEFAULT_DRANK_PERIOD: DrankPeriodKey = "thisMonth";

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Границы периода по дате «когда выпили»: `from` включительно, `to` исключительно.
 * `null` — граница отсутствует (для «всё время»).
 */
export function drankPeriodRange(
  key: DrankPeriodKey,
  now: Date = new Date(),
): { from: string | null; to: string | null } {
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (key) {
    case "thisMonth":
      return { from: isoDay(new Date(y, m, 1)), to: isoDay(new Date(y, m + 1, 1)) };
    case "lastMonth":
      return { from: isoDay(new Date(y, m - 1, 1)), to: isoDay(new Date(y, m, 1)) };
    case "thisYear":
      return { from: isoDay(new Date(y, 0, 1)), to: isoDay(new Date(y + 1, 0, 1)) };
    case "all":
      return { from: null, to: null };
  }
}
