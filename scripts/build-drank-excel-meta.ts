/**
 * Собирает рейтинг (кол. R) и заметки (кол. T) для выпитых вин из My_Wines.xlsx
 * в JSON для отображения в UI без изменения БД.
 *
 *   npx tsx scripts/build-drank-excel-meta.ts "/Users/tati/Downloads/My_Wines.xlsx"
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";

import {
  countSkippedExcelDateRatings,
  extractDrankMetaFromWorkbook,
  type DrankExcelMetaFile,
} from "../lib/myWinesXlsxDrankMeta";

const OUT = path.join(process.cwd(), "data", "drank-excel-meta.json");

function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error(
      'Укажите путь к Excel, например:\n  npx tsx scripts/build-drank-excel-meta.ts "/Users/tati/Downloads/My_Wines.xlsx"',
    );
    process.exit(1);
  }

  const abs = path.resolve(fileArg);
  if (!fs.existsSync(abs)) {
    console.error("Файл не найден:", abs);
    process.exit(1);
  }

  const wb = XLSX.readFile(abs, { cellDates: true, raw: false });
  const byRow = extractDrankMetaFromWorkbook(wb);
  const skippedDates = countSkippedExcelDateRatings(wb);

  const payload: DrankExcelMetaFile = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.basename(abs),
    byRow,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const withRating = Object.values(byRow).filter((e) => e.rating != null).length;
  const withNotes = Object.values(byRow).filter((e) => e.notes).length;
  console.log(
    `Записано ${Object.keys(byRow).length} строк с метой (оценка: ${withRating}, заметки: ${withNotes}) → ${OUT}`,
  );
  if (skippedDates > 0) {
    console.log(
      `Пропущено ${skippedDates} ячеек в кол. R: Excel сохранил их как дату (на экране «8.8», внутри 08.08.2026). Оценку задайте вручную через «Изменить» или исправьте формат в Excel.`,
    );
  }
}

main();
