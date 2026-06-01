import * as XLSX from "xlsx";

import { parseDrankRating, parseExcelRatingCell } from "./wineDrankRating";
import { parseVintageFromExcel } from "./wineVintage";

const EXCEL_RATING_COL = 17; // R
const EXCEL_NOTES_COL = 19; // T

export type DrankExcelMetaEntry = {
  rating: number | null;
  notes: string | null;
};

export type DrankExcelMetaFile = {
  generatedAt: string;
  sourceFile: string;
  byRow: Record<string, DrankExcelMetaEntry>;
};

function findDoneRowIndex(rows: unknown[][]): number {
  return rows.findIndex(
    (r) => String(r?.[0] ?? "").trim().toLowerCase() === "done",
  );
}

function parseRating(
  cell: XLSX.CellObject | undefined,
  rowValue: unknown,
): number | null {
  return parseExcelRatingCell(cell, rowValue);
}

function parseNotes(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  return s || null;
}

/** Строки выпитого вина на листе Wine (1-based номер строки Excel → мета). */
export function extractDrankMetaFromWorkbook(
  wb: XLSX.WorkBook,
): Record<string, DrankExcelMetaEntry> {
  const sh = wb.Sheets["Wine"];
  if (!sh) throw new Error('В файле нет листа "Wine"');

  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: "" }) as unknown[][];
  const doneIdx = findDoneRowIndex(rows);
  const startDrunkAt = Math.max(doneIdx >= 0 ? doneIdx + 1 : 99, 99);

  const byRow: Record<string, DrankExcelMetaEntry> = {};

  for (let i = 0; i < rows.length; i++) {
    if (i < startDrunkAt) continue;
    const row = rows[i];
    if (!row?.length) continue;

    const name = String(row[1] ?? "").trim();
    const producer = String(row[2] ?? "").trim();
    if (!name || !producer) continue;

    const ratingCell = sh[XLSX.utils.encode_cell({ r: i, c: EXCEL_RATING_COL })];
    const rating = parseRating(ratingCell, row[EXCEL_RATING_COL]);
    const notes = parseNotes(row[EXCEL_NOTES_COL]);
    if (rating == null && !notes) continue;

    byRow[String(i + 1)] = { rating, notes };
  }

  return byRow;
}

export function countSkippedExcelDateRatings(wb: XLSX.WorkBook): number {
  const sh = wb.Sheets["Wine"];
  if (!sh) return 0;

  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: "" }) as unknown[][];
  const doneIdx = findDoneRowIndex(rows);
  const startDrunkAt = Math.max(doneIdx >= 0 ? doneIdx + 1 : 99, 99);

  let skipped = 0;
  for (let i = startDrunkAt; i < rows.length; i++) {
    const row = rows[i];
    if (!String(row?.[1] ?? "").trim() || !String(row?.[2] ?? "").trim()) continue;
    const cell = sh[XLSX.utils.encode_cell({ r: i, c: EXCEL_RATING_COL })];
    const rowValue = row[EXCEL_RATING_COL];
    if (cell?.t === "d" || rowValue instanceof Date) skipped++;
  }
  return skipped;
}

export function parseExcelImportRow(notes: string | null | undefined): number | null {
  const m = notes?.match(/\[import:My_Wines\.xlsx\]\s*row\s+(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function drankDisplayFromExcel(
  wine: {
    notes?: string | null;
    drankRating?: number | null;
    drankNotes?: string | null;
  },
  byRow: Record<string, DrankExcelMetaEntry>,
): { rating: number | null; notes: string | null; fromExcel: boolean } {
  const excelRow = parseExcelImportRow(wine.notes);
  const excel = excelRow != null ? byRow[String(excelRow)] : undefined;

  if (excel) {
    return {
      rating:
        wine.drankRating != null && Number.isFinite(wine.drankRating)
          ? wine.drankRating
          : excel.rating,
      notes: wine.drankNotes?.trim() ? wine.drankNotes.trim() : excel.notes,
      fromExcel: Boolean(
        (wine.drankRating == null && excel.rating != null) ||
          (!wine.drankNotes?.trim() && excel.notes),
      ),
    };
  }

  return {
    rating: wine.drankRating ?? null,
    notes: wine.drankNotes?.trim() ?? null,
    fromExcel: false,
  };
}

/** Для отладки / dry-run: ключ вина без привязки к import-tag. */
export function wineExcelIdentityKey(parts: {
  name: string;
  producer: string;
  year: string | null;
}): string {
  const y = parseVintageFromExcel(parts.year) ?? "";
  return `${parts.name.trim().toLowerCase()}|${parts.producer.trim().toLowerCase()}|${y}`;
}
