import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { toWineJson } from "../../../../lib/mapWineJson";
import {
  type GuestWineUpdate,
  validateGuestWineUpdates,
} from "../../../../lib/guestWineApi";
import { requireApiSession } from "../../../../lib/auth/dal";

/** Гостевой список конкретного пользователя. */
function guestListWhere(userId: string) {
  return {
    userId,
    isGuestVisible: true,
    quantity: { gt: 0 },
    drank: false,
  };
}

export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const wines = await prisma.wine.findMany({
    where: guestListWhere(auth.session.userId),
    orderBy: [{ color: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(wines.map(toWineJson));
}

function parseItems(body: unknown): GuestWineUpdate[] | null {
  if (!body || typeof body !== "object") return null;
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return null;

  const out: GuestWineUpdate[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") return null;
    const row = raw as Record<string, unknown>;
    if (typeof row.id !== "string" || !row.id.trim()) return null;

    const parsePrice = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null;
      if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
      const n = Number(String(v).replace(",", "."));
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
    };

    out.push({
      id: row.id.trim(),
      isGuestVisible: Boolean(row.isGuestVisible),
      guestBottlePrice: parsePrice(row.guestBottlePrice),
      guestGlassPrice: parsePrice(row.guestGlassPrice),
    });
  }
  return out;
}

export async function PUT(req: Request) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const items = parseItems(await req.json());
  if (!items) {
    return NextResponse.json({ error: "Нужен массив items" }, { status: 400 });
  }

  const validation = validateGuestWineUpdates(items);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.message, wineIds: validation.wineIds },
      { status: 400 },
    );
  }

  const userId = auth.session.userId;
  const ids = [...new Set(items.map((i) => i.id))];
  // Только вина текущего пользователя — чужие id сюда не пройдут.
  const existing = await prisma.wine.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true, quantity: true },
  });
  const qtyById = new Map(existing.map((w) => [w.id, w.quantity]));

  if (existing.length !== ids.length) {
    return NextResponse.json({ error: "Некоторые вина не найдены" }, { status: 404 });
  }

  if (items.length === 0) {
    const wines = await prisma.wine.findMany({
      where: guestListWhere(userId),
      orderBy: [{ color: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ ok: true, guestCount: wines.length });
  }

  const CHUNK_SIZE = 50;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((item) => {
        const qty = qtyById.get(item.id) ?? 0;
        const visible = item.isGuestVisible && qty > 0;
        return prisma.wine.update({
          where: { id: item.id },
          data: {
            isGuestVisible: visible,
            guestBottlePrice: item.guestBottlePrice,
            guestGlassPrice: item.guestGlassPrice,
          },
        });
      }),
    );
  }

  const wines = await prisma.wine.findMany({
    where: guestListWhere(userId),
    orderBy: [{ color: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ok: true, guestCount: wines.length });
}
