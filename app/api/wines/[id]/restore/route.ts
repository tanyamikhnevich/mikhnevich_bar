import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireApiSession } from "../../../../../lib/auth/dal";
import { toWineJson } from "../../../../../lib/mapWineJson";
import { wineIdentityWhere } from "../../../../../lib/wineRecord";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;

  const wine = await prisma.wine.findFirst({
    where: { id, userId: auth.session.userId },
  });
  if (!wine) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  if (!wine.drank) {
    return NextResponse.json({ error: "Вино не в разделе «Выпито»" }, { status: 400 });
  }

  try {
    const match = await prisma.wine.findFirst({
      where: {
        drank: false,
        id: { not: wine.id },
        ...wineIdentityWhere(wine),
      },
    });

    if (match) {
      const merged = await prisma.$transaction(async (tx) => {
        const active = await tx.wine.update({
          where: { id: match.id },
          data: { quantity: match.quantity + wine.quantity },
        });
        await tx.wine.delete({ where: { id: wine.id } });
        return active;
      });
      return NextResponse.json({
        active: toWineJson(merged),
        mode: "merged" as const,
      });
    }

    const restored = await prisma.wine.update({
      where: { id },
      data: {
        drank: false,
        drankAt: null,
        drankRating: null,
        drankNotes: null,
      },
    });
    return NextResponse.json({
      active: toWineJson(restored),
      mode: "restored" as const,
    });
  } catch {
    return NextResponse.json({ error: "Не удалось вернуть в коллекцию" }, { status: 500 });
  }
}
