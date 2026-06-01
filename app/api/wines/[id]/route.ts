import { NextResponse } from "next/server";
import type { Prisma } from "../../../../lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toWineJson } from "@/lib/mapWineJson";
import { normalizeWineGeo, normalizeWineText } from "@/lib/wineNormalize";
import { normalizeWineVintage } from "@/lib/wineVintage";
import { parseDrankRating } from "@/lib/wineDrankRating";
import { parseVivinoFromRatings } from "@/lib/wineUtils";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;

  const data: Record<string, unknown> = {};

  if (typeof body.drank === "boolean") data.drank = body.drank;

  if (typeof body.name === "string") {
    data.name = normalizeWineText(body.name) ?? body.name.trim();
  }
  if (typeof body.producer === "string") {
    data.producer = normalizeWineText(body.producer) ?? body.producer.trim();
  }

  if ("year" in body) {
    const v = normalizeWineVintage(body.year);
    data.year = v === undefined ? undefined : v;
  }

  const geoTouched =
    "country" in body ||
    "countryCode" in body ||
    "region" in body ||
    "subregion" in body ||
    "grape" in body;

  if (geoTouched) {
    const existing = await prisma.wine.findUnique({
      where: { id },
      select: {
        country: true,
        countryCode: true,
        region: true,
        subregion: true,
        grape: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    const readGeo = (key: "country" | "countryCode" | "region" | "subregion" | "grape") => {
      if (!(key in body)) return existing[key];
      const v = body[key];
      return v === null || v === undefined || v === "" ? null : String(v);
    };

    const geo = normalizeWineGeo({
      country: readGeo("country"),
      countryCode: readGeo("countryCode"),
      region: readGeo("region"),
      subregion: readGeo("subregion"),
      grape: readGeo("grape"),
    });

    if ("country" in body || "countryCode" in body) {
      data.country = geo.country;
      data.countryCode = geo.countryCode;
    }
    if ("region" in body) data.region = geo.region;
    if ("subregion" in body) data.subregion = geo.subregion;
    if ("grape" in body) data.grape = geo.grape;
  }

  if ("notes" in body) {
    const v = body.notes;
    data.notes = v === null || v === undefined || v === "" ? null : String(v);
  }

  for (const key of ["purchaseCurrency", "originCurrency", "israelCurrency"] as const) {
    if (key in body) {
      const v = body[key];
      if (v === null || v === undefined || v === "") data[key] = null;
      else data[key] = String(v).trim().slice(0, 8);
    }
  }

  if ("ratings" in body) {
    const r =
      body.ratings === null || body.ratings === undefined
        ? null
        : String(body.ratings).trim() || null;
    data.ratings = r;
    if (!("vivinoRating" in body)) {
      data.vivinoRating = parseVivinoFromRatings(r ?? "");
    }
  }

  if ("vivinoRating" in body) {
    if (body.vivinoRating === null || body.vivinoRating === "") data.vivinoRating = null;
    else if (typeof body.vivinoRating === "number" && Number.isFinite(body.vivinoRating)) {
      data.vivinoRating = body.vivinoRating;
    }
  }

  if ("drankRating" in body) {
    if (body.drankRating === null || body.drankRating === "") {
      data.drankRating = null;
    } else {
      const parsed = parseDrankRating(body.drankRating);
      if (parsed === null) {
        return NextResponse.json({ error: "Некорректная оценка (0–10)" }, { status: 400 });
      }
      data.drankRating = parsed;
    }
  }

  if ("drankNotes" in body) {
    const v = body.drankNotes;
    data.drankNotes =
      v === null || v === undefined || v === "" ? null : String(v).trim().slice(0, 4000);
  }

  if ("drankAt" in body) {
    if (body.drankAt === null || body.drankAt === "") {
      data.drankAt = null;
    } else if (typeof body.drankAt === "string") {
      const d = new Date(body.drankAt);
      data.drankAt = Number.isNaN(d.getTime()) ? null : d;
    }
  }

  const parseIntOrNull = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
    const n = Number(String(v));
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  for (const key of [
    "purchasePrice",
    "originPrice",
    "israelPrice",
    "guestBottlePrice",
    "guestGlassPrice",
  ] as const) {
    if (key in body) data[key] = parseIntOrNull(body[key]);
  }

  if ("guestPrice" in body && !("guestBottlePrice" in body)) {
    data.guestBottlePrice = parseIntOrNull(body.guestPrice);
  }

  if (typeof body.isGuestVisible === "boolean") {
    data.isGuestVisible = body.isGuestVisible;
  }

  if ("purchaseDate" in body) {
    if (body.purchaseDate === null || body.purchaseDate === "") data.purchaseDate = null;
    else if (typeof body.purchaseDate === "string") {
      const d = new Date(body.purchaseDate);
      data.purchaseDate = Number.isNaN(d.getTime()) ? null : d;
    }
  }

  if (typeof body.quantity === "number" && Number.isFinite(body.quantity)) {
    data.quantity = Math.min(999, Math.max(1, Math.round(body.quantity)));
  }

  if (
    typeof body.color === "string" &&
    ["red", "white", "rose", "sparkling"].includes(body.color)
  ) {
    data.color = body.color;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Пустое тело запроса" }, { status: 400 });
  }

  try {
    const updated = await prisma.wine.update({
      where: { id },
      data: data as Prisma.WineUpdateInput,
    });
    return NextResponse.json(toWineJson(updated));
  } catch {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  try {
    await prisma.wine.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
}
