/** Оценка выпитого вина: 0–10, до двух знаков после запятой (9.4, 9.75). */
export function parseDrankRating(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (raw instanceof Date) return null;

  if (typeof raw === "number") {
    if (isExcelDateSerial(raw)) return null;
    if (!Number.isFinite(raw) || raw < 0 || raw > 10) return null;
    return Math.round(raw * 100) / 100;
  }

  const s = String(raw).trim();
  if (!s) return null;
  if (looksLikeDateText(s)) return null;

  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 10) return null;
  return Math.round(n * 100) / 100;
}

/** Excel хранит даты как serial ~25k–65k; это не рейтинг. */
export function isExcelDateSerial(n: number): boolean {
  return Number.isFinite(n) && n >= 25_000 && n <= 65_000;
}

function looksLikeDateText(s: string): boolean {
  return (
    /^\d{1,2}[./]\d{1,2}([./]\d{2,4})?$/.test(s) ||
    /^\d{4}-\d{2}-\d{2}/.test(s)
  );
}

/** Ячейка R в My_Wines.xlsx: отбрасываем даты, которые Excel показывает как «8.8». */
export function parseExcelRatingCell(
  cell: { t?: string; v?: unknown } | undefined,
  rowValue: unknown,
): number | null {
  if (rowValue instanceof Date) return null;
  if (cell?.t === "d") return null;
  if (typeof cell?.v === "number" && isExcelDateSerial(cell.v)) return null;
  return parseDrankRating(rowValue);
}

export function formatDrankRating(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
