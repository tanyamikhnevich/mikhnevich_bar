import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/auth/dal";
import { toWineJson } from "@/lib/mapWineJson";
import { parseVivinoFromRatings } from "@/lib/wineUtils";
import { normalizeWineGeo } from "@/lib/wineNormalize";
import { normalizeWineVintage } from "@/lib/wineVintage";
import { getServerDictionary } from "@/lib/i18n/server";

/** Полный список (без фильтров). Для UI используйте GET /api/wines/browse. */
export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const wines = await prisma.wine.findMany({
    where: { userId: auth.session.userId },
    orderBy: [
      { drank: "asc" },
      { color: "asc" },
      { createdAt: "desc" },
      { id: "asc" },
    ],
  });

  return NextResponse.json(wines.map(toWineJson));
}

export async function POST(req: Request) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const body = (await req.json()) as Record<string, unknown>;

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const producer = typeof body.producer === "string" ? body.producer.trim() : "";
  if (!name || !producer) {
    const { errors } = await getServerDictionary();
    return NextResponse.json({ error: errors.nameProducerRequired }, { status: 400 });
  }

  const ratings =
    body.ratings === null || body.ratings === undefined
      ? null
      : String(body.ratings).trim() || null;

  const vivinoFromBody =
    body.vivinoRating === null || body.vivinoRating === ""
      ? null
      : typeof body.vivinoRating === "number" && Number.isFinite(body.vivinoRating)
        ? body.vivinoRating
        : null;

  const vivinoRating = vivinoFromBody ?? parseVivinoFromRatings(ratings ?? "");

  const color =
    typeof body.color === "string" &&
    ["red", "white", "rose", "sparkling"].includes(body.color)
      ? body.color
      : "red";

  const year = normalizeWineVintage(body.year) ?? null;

  const quantity =
    typeof body.quantity === "number" && Number.isFinite(body.quantity)
      ? Math.min(999, Math.max(1, Math.round(body.quantity)))
      : 1;

  const parseIntOrNull = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
    const n = Number(String(v));
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  const currencyOrNull = (v: unknown) => {
    if (v === null || v === undefined) return null;
    const t = String(v).trim();
    return t ? t.slice(0, 8) : null;
  };

  const purchaseDate =
    body.purchaseDate === null || body.purchaseDate === "" || body.purchaseDate === undefined
      ? null
      : typeof body.purchaseDate === "string"
        ? new Date(body.purchaseDate)
        : null;

  const geo = normalizeWineGeo({
    country: body.country == null ? null : String(body.country),
    countryCode: body.countryCode == null ? null : String(body.countryCode),
    region: body.region == null ? null : String(body.region),
    subregion: body.subregion == null ? null : String(body.subregion),
    grape: body.grape == null ? null : String(body.grape),
  });

  const created = await prisma.wine.create({
    data: {
      userId: auth.session.userId,
      name,
      producer,
      year,
      ...geo,
      ratings,
      purchasePrice: parseIntOrNull(body.purchasePrice),
      purchaseCurrency: currencyOrNull(body.purchaseCurrency),
      originPrice: parseIntOrNull(body.originPrice),
      originCurrency: currencyOrNull(body.originCurrency),
      israelPrice: parseIntOrNull(body.israelPrice),
      israelCurrency: currencyOrNull(body.israelCurrency),
      isGuestVisible: Boolean(body.isGuestVisible),
      guestBottlePrice: parseIntOrNull(body.guestBottlePrice ?? body.guestPrice),
      guestGlassPrice: parseIntOrNull(body.guestGlassPrice),
      purchaseDate:
        purchaseDate && !Number.isNaN(purchaseDate.getTime()) ? purchaseDate : null,
      vivinoRating,
      quantity,
      color: color as "red" | "white" | "rose" | "sparkling",
      drank: Boolean(body.drank),
      notes: body.notes == null ? null : String(body.notes),
    },
  });

  return NextResponse.json(toWineJson(created), { status: 201 });
}
