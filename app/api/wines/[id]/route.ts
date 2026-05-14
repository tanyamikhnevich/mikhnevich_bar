import { NextResponse } from "next/server";
import type { Prisma } from "../../../../lib/generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import { toWineJson } from "../../../../lib/mapWineJson";
import { parseVivinoFromRatings } from "../../../../lib/wineUtils";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;

  const data: Record<string, unknown> = {};

  if (typeof body.drank === "boolean") data.drank = body.drank;

  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.producer === "string") data.producer = body.producer.trim();

  if ("year" in body) {
    if (body.year === null || body.year === "") data.year = null;
    else if (typeof body.year === "number" && Number.isFinite(body.year)) {
      data.year = Math.round(body.year);
    }
  }

  for (const key of ["country", "countryCode", "region", "subregion", "grape", "notes"] as const) {
    if (key in body) {
      const v = body[key];
      data[key] = v === null || v === undefined || v === "" ? null : String(v);
    }
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

  const parseIntOrNull = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
    const n = Number(String(v));
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  for (const key of ["purchasePrice", "originPrice", "israelPrice", "guestPrice"] as const) {
    if (key in body) data[key] = parseIntOrNull(body[key]);
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
