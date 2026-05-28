/**
 * Импорт вин из Excel (My_Wines.xlsx) в Postgres через Prisma.
 *
 * Использование:
 *   npx tsx scripts/import-my-wines-xlsx.ts "/path/to/My_Wines.xlsx"
 *   npx tsx scripts/import-my-wines-xlsx.ts "/path/to/My_Wines.xlsx" --dry-run
 *
 * Переменная окружения DATABASE_URL должна указывать на вашу БД (как в .env).
 *
 * Только лист **Wine**. Выпитые строки: с **100-й строки Excel** (после 99-й) **или** всё, что
 * ниже ячейки **Done** в первом столбце — берётся **более поздняя** из двух границ.
 * Секции **Red / White / Rose / Sparkling** (и русские названия) задают тип; **Sparkling** = игристое.
 * Листы Sold / Flags не используются.
 *
 * **Год (кол. 5):** число 1800–2100; **N.V.** / NV / NAS / N/A — нет винтажа,
 * сохраняется как `N.V.` (не null и не «—»). См. `lib/wineVintage.ts`.
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";

import type { WineColor } from "../lib/generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { normalizeWineGeo } from "../lib/wineNormalize";
import { parseVintageFromExcel } from "../lib/wineVintage";
import { parseVivinoFromRatings } from "../lib/wineUtils";
import { normalizeWineYear, parseVivinoFromRatings } from "../lib/wineUtils";

const IMPORT_TAG = "[import:My_Wines.xlsx]";

type PricePair = { amount: number; currency: string };

const MAX_INT32 = 2_147_483_647;

function clampInt(n: number | null, max = MAX_INT32): number | null {
  if (n === null) return null;
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (Math.abs(rounded) > max) return null;
  return rounded;
}

function parseAmount(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.round(raw);
    if (Math.abs(n) > 10_000_000) return null;
    return n;
  }
  const s = String(raw).trim();
  if (!s || s === "-" || s === "—") return null;
  const cleaned = s.replace(",", ".").replace(/[^\d.+]/g, "");
  if (!cleaned) return null;
  if (cleaned.includes("+")) {
    const head = cleaned.split("+")[0] ?? "";
    const n = Number(head);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (Math.abs(rounded) > 10_000_000) return null;
  return rounded;
}

function parsePricePairs(row: unknown[]): PricePair[] {
  const pairs: PricePair[] = [];
  for (let i = 11; i < row.length - 1; i += 2) {
    const amount = parseAmount(row[i]);
    const currency = String(row[i + 1] ?? "").trim();
    if (amount === null) continue;
    pairs.push({ amount, currency });
  }
  return pairs;
}

function parseYear(raw: unknown): string | null {
  return normalizeWineYear(raw);
}

function parseQuantity(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(999, Math.max(1, Math.round(n)));
}

function normalizeColorCell(v: unknown): WineColor | null {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (s === "red" || s === "красное") return "red";
  if (s === "white" || s === "белое") return "white";
  if (s === "rose" || s === "розовое") return "rose";
  if (
    s === "sparkling" ||
    s === "игристое" ||
    s === "шампанское" ||
    s === "champagne" ||
    s === "spumante" ||
    s === "cava" ||
    s === "prosecco" ||
    s === "franciacorta" ||
    s === "cremant"
  ) {
    return "sparkling";
  }
  return null;
}

function mapPrices(pairs: PricePair[]) {
  const p0 = pairs[0];
  const purchasePrice = clampInt(p0?.amount ?? null);
  const purchaseCurrency = normalizeCurrencySymbol(p0?.currency);

  const ils = pairs.filter((p) => p.currency.includes("₪"));
  const israelPair = ils.length >= 2 ? ils[1] : ils[0];
  const israelPrice = clampInt(israelPair?.amount ?? null);
  const israelCurrency = normalizeCurrencySymbol(israelPair?.currency);

  const foreign = pairs.find(
    (p) =>
      !p.currency.includes("₪") &&
      (/[€£]/.test(p.currency) || /\$|USD|EUR|GBP/i.test(p.currency)),
  );
  const originPrice = clampInt(foreign?.amount ?? null);
  const originCurrency = normalizeCurrencySymbol(foreign?.currency);

  return {
    purchasePrice,
    purchaseCurrency,
    israelPrice,
    israelCurrency,
    originPrice,
    originCurrency,
  };
}

function normalizeCurrencySymbol(raw: string | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  return t.slice(0, 8);
}

function findDoneRowIndex(rows: unknown[][]): number {
  return rows.findIndex(
    (r) => String(r?.[0] ?? "").trim().toLowerCase() === "done",
  );
}

export type ParseWineImportStats = {
  sheetRowCount: number;
  importedWineRows: number;
  skippedColorSectionHeaders: number;
  skippedDoneMarkers: number;
  skippedNoName: number;
  skippedNoProducer: number;
};

function parseWineRows(wb: XLSX.WorkBook): {
  wines: Array<{
    name: string;
    producer: string;
    year: string | null;
    country: string | null;
    countryCode: string | null;
    region: string | null;
    subregion: string | null;
    grape: string | null;
    ratings: string | null;
    purchasePrice: number | null;
    purchaseCurrency: string | null;
    originPrice: number | null;
    originCurrency: string | null;
    israelPrice: number | null;
    israelCurrency: string | null;
    purchaseDate: Date | null;
    vivinoRating: number | null;
    quantity: number;
    color: WineColor;
    drank: boolean;
    notes: string | null;
  }>;
  stats: ParseWineImportStats;
} {
  const sh = wb.Sheets["Wine"];
  if (!sh) throw new Error('В файле нет листа "Wine"');
  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: "" }) as unknown[][];

  const stats: ParseWineImportStats = {
    sheetRowCount: rows.length,
    importedWineRows: 0,
    skippedColorSectionHeaders: 0,
    skippedDoneMarkers: 0,
    skippedNoName: 0,
    skippedNoProducer: 0,
  };

  const doneIdx = findDoneRowIndex(rows);
  /** После 99-й строки Excel = с 100-й; 0-based индекс первой «выпитой» строки = 99 */
  const startDrunkAt = Math.max(doneIdx >= 0 ? doneIdx + 1 : 99, 99);
  const wines: Array<{
    name: string;
    producer: string;
    year: string | null;
    country: string | null;
    countryCode: string | null;
    region: string | null;
    subregion: string | null;
    grape: string | null;
    ratings: string | null;
    purchasePrice: number | null;
    purchaseCurrency: string | null;
    originPrice: number | null;
    originCurrency: string | null;
    israelPrice: number | null;
    israelCurrency: string | null;
    purchaseDate: Date | null;
    vivinoRating: number | null;
    quantity: number;
    color: WineColor;
    drank: boolean;
    notes: string | null;
  }> = [];

  let color: WineColor = "red";

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row?.length) continue;

    const c0 = row[0];
    if (String(c0 ?? "").trim().toLowerCase() === "done") {
      stats.skippedDoneMarkers++;
      continue;
    }

    const maybeColor = normalizeColorCell(c0);
    if (
      maybeColor &&
      !String(row[1] ?? "").trim() &&
      !String(row[2] ?? "").trim()
    ) {
      stats.skippedColorSectionHeaders++;
      color = maybeColor;
      continue;
    }

    const name = String(row[1] ?? "").trim();
    const producer = String(row[2] ?? "").trim();
    if (!name) {
      stats.skippedNoName++;
      continue;
    }
    if (!producer) {
      stats.skippedNoProducer++;
      continue;
    }

    const drank = i >= startDrunkAt;

    const purchaseDate =
      c0 instanceof Date ? c0 : typeof c0 === "number" ? new Date(Math.round((c0 - 25569) * 86400 * 1000)) : null;

    const year = parseVintageFromExcel(row[4]);
    const quantity = parseQuantity(row[5]);
    const geo = normalizeWineGeo({
      country: String(row[7] ?? "").trim() || null,
      region: String(row[8] ?? "").trim() || null,
      subregion: String(row[9] ?? "").trim() || null,
      grape: String(row[10] ?? "").trim() || null,
    });

    const pairs = parsePricePairs(row);
    const {
      purchasePrice,
      purchaseCurrency,
      israelPrice,
      israelCurrency,
      originPrice,
      originCurrency,
    } = mapPrices(pairs);
    const ratingsRaw = String(row[3] ?? "").trim();
    const ratings = ratingsRaw || null;
    const vivinoRating = parseVivinoFromRatings(ratingsRaw);

    const notes = `${IMPORT_TAG} row ${i + 1}`;

    wines.push({
      name,
      producer,
      year,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      subregion: geo.subregion,
      grape: geo.grape,
      ratings,
      purchasePrice,
      purchaseCurrency,
      originPrice,
      originCurrency,
      israelPrice,
      israelCurrency,
      purchaseDate: purchaseDate && !Number.isNaN(purchaseDate.getTime()) ? purchaseDate : null,
      vivinoRating,
      quantity,
      color,
      drank,
      notes,
    });
    stats.importedWineRows++;
  }

  return { wines, stats };
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const fileArg = argv.find((a) => !a.startsWith("--"));
  if (!fileArg) {
    console.error(
      "Укажите путь к файлу, например:\n  npx tsx scripts/import-my-wines-xlsx.ts \"/Users/you/Downloads/My_Wines.xlsx\"",
    );
    process.exit(1);
  }

  const abs = path.resolve(fileArg);
  if (!fs.existsSync(abs)) {
    console.error("Файл не найден:", abs);
    process.exit(1);
  }

  const wb = XLSX.readFile(abs, { cellDates: true, raw: false });
  const { wines: parsed, stats } = parseWineRows(wb);
  const active = parsed.filter((w) => !w.drank).length;
  const drankN = parsed.filter((w) => w.drank).length;

  console.log(
    `Импортировано записей вина: ${parsed.length} (активных: ${active}, выпито: ${drankN}). Граница выпитого: с 100-й строки Excel и/или после «Done» (позднее из двух).`,
  );
  console.log(
    `Статистика листа Wine: всего строк в массиве ${stats.sheetRowCount}; заголовки секций (Red/White/Sparkling…) ${stats.skippedColorSectionHeaders}; маркер Done ${stats.skippedDoneMarkers}; без названия ${stats.skippedNoName}; без производителя ${stats.skippedNoProducer}.`,
  );
  console.log(
    "Почему число может отличаться от Excel: в базу попадают только строки с заполненными «Название» и «Производитель»; пустые строки, только заголовки секций и строка Done не считаются позициями вина.",
  );
  if (dryRun) {
    console.log("Dry-run: записи в БД не вносим.");
    return;
  }

  const deleted = await prisma.wine.deleteMany({
    where: { notes: { contains: IMPORT_TAG } },
  });
  console.log(`Удалено предыдущих импортов (по метке в notes): ${deleted.count}`);

  const chunkSize = 200;
  let inserted = 0;
  for (let i = 0; i < parsed.length; i += chunkSize) {
    const chunk = parsed.slice(i, i + chunkSize);
    const res = await prisma.wine.createMany({ data: chunk });
    inserted += res.count;
  }

  console.log(`Добавлено записей: ${inserted}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
