import "dotenv/config";
import { writeFileSync } from "node:fs";
import { prisma } from "../lib/prisma";

/**
 * Для израильских вин, где «Оригинал» (originPrice) пуст, а цена «Израиль»
 * (israelPrice) есть — копирует цену и валюту из «Израиль» в «Оригинал».
 *
 * По умолчанию — только предпросмотр (ничего не меняет).
 * Применить изменения: npx tsx scripts/fill-israel-origin.ts --apply
 */
async function main() {
  const apply = process.argv.includes("--apply");

  const candidates = await prisma.wine.findMany({
    where: {
      OR: [
        { countryCode: "IL" },
        { country: { equals: "Israel", mode: "insensitive" } },
        { country: { equals: "Израиль", mode: "insensitive" } },
      ],
      originPrice: null,
      israelPrice: { not: null },
    },
    select: {
      id: true,
      name: true,
      country: true,
      countryCode: true,
      israelPrice: true,
      israelCurrency: true,
      originCurrency: true,
    },
    orderBy: { name: "asc" },
  });

  console.log(
    `Израильских вин без «Оригинал», но с ценой «Израиль»: ${candidates.length}`,
  );
  for (const w of candidates) {
    console.log(
      `  • ${w.name} [${w.country ?? w.countryCode}] — Израиль ${w.israelPrice} ${w.israelCurrency ?? ""} → Оригинал`,
    );
  }

  if (!apply) {
    console.log(
      "\n(Предпросмотр — ничего не изменено.) Применить: npx tsx scripts/fill-israel-origin.ts --apply",
    );
    return;
  }

  if (candidates.length === 0) {
    console.log("Нечего обновлять.");
    return;
  }

  // Резервная копия затронутых записей — на случай отката.
  const backup = candidates.map((w) => ({
    id: w.id,
    prevOriginPrice: null as number | null,
    prevOriginCurrency: w.originCurrency,
  }));
  const backupPath = `israel-origin-backup-${Date.now()}.json`;
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Резервная копия сохранена: ${backupPath}`);

  // updateMany не умеет копировать значение из другого столбца, поэтому
  // одной атомарной операцией на сыром SQL — строго по отобранным id.
  const ids = candidates.map((w) => w.id);
  const affected = await prisma.$executeRawUnsafe(
    `UPDATE "Wine"
       SET "originPrice" = "israelPrice",
           "originCurrency" = COALESCE("originCurrency", "israelCurrency")
     WHERE "id" = ANY($1::text[])
       AND "originPrice" IS NULL
       AND "israelPrice" IS NOT NULL`,
    ids,
  );
  console.log(`\nОбновлено вин: ${affected}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
