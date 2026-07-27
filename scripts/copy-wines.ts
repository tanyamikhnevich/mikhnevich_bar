import "dotenv/config";
import { prisma } from "../lib/prisma";

/**
 * Скопировать все вина одного пользователя другому (независимые копии).
 *
 * Использование:
 *   npx tsx scripts/copy-wines.ts <from-email> <to-email> [--force]
 *
 * По умолчанию, если у получателя уже есть вина, копирование отменяется
 * (чтобы случайно не задублировать). Флаг --force разрешает копировать поверх.
 */
async function main() {
  const fromEmail = (process.argv[2] ?? "").trim().toLowerCase();
  const toEmail = (process.argv[3] ?? "").trim().toLowerCase();
  const force = process.argv.includes("--force");

  if (!fromEmail || !toEmail) {
    console.error(
      "Использование: npx tsx scripts/copy-wines.ts <from-email> <to-email> [--force]",
    );
    process.exit(1);
  }
  if (fromEmail === toEmail) {
    console.error("from и to не должны совпадать.");
    process.exit(1);
  }

  const [from, to] = await Promise.all([
    prisma.user.findUnique({ where: { email: fromEmail } }),
    prisma.user.findUnique({ where: { email: toEmail } }),
  ]);

  if (!from) {
    console.error(`Пользователь-источник ${fromEmail} не найден.`);
    process.exit(1);
  }
  if (!to) {
    console.error(
      `Пользователь-получатель ${toEmail} не найден. Сначала: npm run create:user ${toEmail} "<пароль>"`,
    );
    process.exit(1);
  }

  const existingCount = await prisma.wine.count({ where: { userId: to.id } });
  if (existingCount > 0 && !force) {
    console.error(
      `У ${toEmail} уже есть вина (${existingCount}). Чтобы всё равно скопировать, добавьте --force.`,
    );
    process.exit(1);
  }

  const source = await prisma.wine.findMany({ where: { userId: from.id } });

  const data = source.map((w) => ({
    userId: to.id,
    name: w.name,
    producer: w.producer,
    year: w.year,
    country: w.country,
    countryCode: w.countryCode,
    region: w.region,
    subregion: w.subregion,
    grape: w.grape,
    purchasePrice: w.purchasePrice,
    purchaseCurrency: w.purchaseCurrency,
    originPrice: w.originPrice,
    originCurrency: w.originCurrency,
    israelPrice: w.israelPrice,
    israelCurrency: w.israelCurrency,
    isGuestVisible: w.isGuestVisible,
    guestBottlePrice: w.guestBottlePrice,
    guestGlassPrice: w.guestGlassPrice,
    purchaseDate: w.purchaseDate,
    vivinoRating: w.vivinoRating,
    ratings: w.ratings,
    quantity: w.quantity,
    color: w.color,
    drank: w.drank,
    drankAt: w.drankAt,
    drankRating: w.drankRating,
    drankNotes: w.drankNotes,
    notes: w.notes,
  }));

  const { count } = await prisma.wine.createMany({ data });
  console.log(`Скопировано вин из ${fromEmail} → ${toEmail}: ${count}`);
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
