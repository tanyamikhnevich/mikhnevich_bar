import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { toWineJson } from "../../../../../lib/mapWineJson";
import { wineDuplicateCreateData } from "../../../../../lib/wineRecord";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await req.json()) as { quantity?: unknown };

  let amount = 1;
  if (body.quantity !== undefined && body.quantity !== null && body.quantity !== "") {
    const n =
      typeof body.quantity === "number"
        ? body.quantity
        : Number(String(body.quantity).replace(",", "."));
    if (!Number.isFinite(n)) {
      return NextResponse.json({ error: "Некорректное количество" }, { status: 400 });
    }
    amount = Math.round(n);
  }

  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  if (wine.drank) {
    return NextResponse.json({ error: "Вино уже в разделе «Выпито»" }, { status: 400 });
  }
  if (amount < 1) {
    return NextResponse.json({ error: "Укажите количество не меньше 1" }, { status: 400 });
  }
  if (amount > wine.quantity) {
    return NextResponse.json(
      { error: `В коллекции только ${wine.quantity} шт.` },
      { status: 400 },
    );
  }

  try {
    if (amount === wine.quantity) {
      const updated = await prisma.wine.update({
        where: { id },
        data: { drank: true },
      });
      return NextResponse.json({
        active: toWineJson(updated),
        drank: toWineJson(updated),
        mode: "moved" as const,
      });
    }

    const [active, drank] = await prisma.$transaction([
      prisma.wine.update({
        where: { id },
        data: { quantity: wine.quantity - amount },
      }),
      prisma.wine.create({
        data: wineDuplicateCreateData(wine, { quantity: amount, drank: true }),
      }),
    ]);

    return NextResponse.json({
      active: toWineJson(active),
      drank: toWineJson(drank),
      mode: "split" as const,
    });
  } catch {
    return NextResponse.json({ error: "Не удалось отметить выпитым" }, { status: 500 });
  }
}
