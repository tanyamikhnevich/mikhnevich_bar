/**
 * Правила поля «год» / винтаж (Excel, API, UI).
 *
 * - Числовой год (1800–2100) хранится строкой, напр. `"2016"`.
 * - **N.V.** (No Vintage) — нет винтажа: в Excel `N.V.`, `NV`, `NAS`, `N/A`;
 *   в БД и в таблице всегда каноническое **`N.V.`**, не null и не «—».
 */

export const WINE_VINTAGE_NV = "N.V." as const;

const NV_PATTERN = /^(n\.?\s*v\.?|nas|n\/a)$/i;

export function isNoVintageValue(raw: string | number | null | undefined): boolean {
  if (raw === null || raw === undefined) return false;
  const s = String(raw).trim();
  return s !== "" && NV_PATTERN.test(s);
}

/** Нормализует сырое значение года в строку для БД или null, если пусто. */
export function normalizeWineVintage(
  raw: unknown,
): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const y = Math.round(raw);
    if (y >= 1800 && y <= 2100) return String(y);
    return null;
  }
  const s = String(raw).trim();
  if (!s || s === "-" || s === "—") return null;
  if (isNoVintageValue(s)) return WINE_VINTAGE_NV;
  const n = Number(s.replace(",", "."));
  if (Number.isFinite(n)) {
    const y = Math.round(n);
    if (y >= 1800 && y <= 2100) return String(y);
  }
  return null;
}

/** Парсинг ячейки года из Excel (импорт). */
export function parseVintageFromExcel(raw: unknown): string | null {
  return normalizeWineVintage(raw) ?? null;
}

/** Ввод в форме: год или N.V.; null — невалидно. */
export function parseVintageFromFormInput(raw: string): string | null {
  return normalizeWineVintage(raw) ?? null;
}

/** Сообщение об ошибке для поля «год» в форме; null — ок. */
export function getWineYearInputError(raw: string): string | null {
  if (!raw.trim()) return "Укажите год или нажмите N.V.";
  if (parseVintageFromFormInput(raw) == null) {
    return `Число 1800–2100 или ${WINE_VINTAGE_NV}`;
  }
  return null;
}

/** Отображение в таблице: N.V. как есть; пустое — «—». */
export function formatWineYear(year: string | number | null | undefined): string {
  if (year === null || year === undefined) return "—";
  const s = String(year).trim();
  if (!s) return "—";
  if (isNoVintageValue(s)) return WINE_VINTAGE_NV;
  return s;
}
