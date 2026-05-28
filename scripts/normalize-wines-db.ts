/**
 * Нормализует country / region / subregion / grape во всех строках Wine.
 *
 *   npx tsx scripts/normalize-wines-db.ts
 *   npx tsx scripts/normalize-wines-db.ts --dry-run
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { normalizeWineGeo, normalizeWineText } from "../lib/wineNormalize";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const wines = await prisma.wine.findMany({
    select: {
      id: true,
      country: true,
      countryCode: true,
      region: true,
      subregion: true,
      grape: true,
      name: true,
      producer: true,
    },
  });

  let updated = 0;
  for (const w of wines) {
    const geo = normalizeWineGeo({
      country: w.country,
      countryCode: w.countryCode,
      region: w.region,
      subregion: w.subregion,
      grape: w.grape,
    });
    const name = normalizeWineText(w.name) ?? w.name;
    const producer = normalizeWineText(w.producer) ?? w.producer;

    const changed =
      geo.country !== w.country ||
      geo.countryCode !== w.countryCode ||
      geo.region !== w.region ||
      geo.subregion !== w.subregion ||
      geo.grape !== w.grape ||
      name !== w.name ||
      producer !== w.producer;

    if (!changed) continue;
    updated += 1;

    if (dryRun) {
      console.log(w.id, { before: w, after: { ...geo, name, producer } });
      continue;
    }

    await prisma.wine.update({
      where: { id: w.id },
      data: { ...geo, name, producer },
    });
  }

  console.log(
    dryRun
      ? `Будет обновлено строк: ${updated} (dry-run)`
      : `Обновлено строк: ${updated}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
