import "dotenv/config";
import { prisma } from "../lib/prisma";

/**
 * Привязать все «ничейные» вина (userId = NULL) к пользователю по email.
 * Запускать один раз после создания аккаунта — чтобы старая коллекция
 * стала вашей. Идемпотентно: повторный запуск ничего не сломает.
 *
 * Использование:
 *   npx tsx scripts/assign-wines.ts you@example.com
 */
async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  if (!email) {
    console.error("Использование: npx tsx scripts/assign-wines.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `Пользователь ${email} не найден. Сначала: npm run create:user ${email} "<пароль>"`,
    );
    process.exit(1);
  }

  const { count } = await prisma.wine.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });

  console.log(`Привязано вин к ${user.email}: ${count}`);
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
