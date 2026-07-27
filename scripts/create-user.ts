import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";

/**
 * Создать или обновить пользователя для входа.
 *
 * Использование:
 *   npx tsx scripts/create-user.ts you@example.com "ваш-пароль"
 *
 * Пароль передаётся аргументом и нигде не сохраняется в открытом виде —
 * в базу пишется только его scrypt-хеш.
 */
async function main() {
  const [, , emailArg, passwordArg] = process.argv;
  const email = (emailArg ?? "").trim().toLowerCase();
  const password = passwordArg ?? "";

  if (!email || !password) {
    console.error(
      'Использование: npx tsx scripts/create-user.ts <email> "<пароль>"',
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Пароль должен быть не короче 8 символов.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Готово. Пользователь: ${user.email} (id: ${user.id})`);
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
