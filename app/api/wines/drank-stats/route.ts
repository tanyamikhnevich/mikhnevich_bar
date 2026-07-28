import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireApiSession } from "../../../../lib/auth/dal";
import { getIlsRates } from "../../../../lib/exchangeRates";
import { buildWineBrowseWhere, parseWineBrowseFilters } from "../../../../lib/wineQuery";
import { computeDrankStats } from "../../../../lib/drankStats";

/** Дата вида YYYY-MM-DD в локальную полночь; иначе null. */
function parseDay(raw: string | null): Date | null {
  if (!raw) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const url = new URL(req.url);
  const filters = { ...parseWineBrowseFilters(url.searchParams), drank: true };
  const where = buildWineBrowseWhere(filters, auth.session.userId);

  const from = parseDay(url.searchParams.get("from"));
  const to = parseDay(url.searchParams.get("to"));

  const exchange = await getIlsRates();

  const rows = await prisma.wine.findMany({
    where,
    select: {
      purchasePrice: true,
      purchaseCurrency: true,
      israelPrice: true,
      israelCurrency: true,
      quantity: true,
      country: true,
      color: true,
      drankAt: true,
      name: true,
    },
  });

  const stats = computeDrankStats(rows, exchange.ils, { from, to });

  return NextResponse.json({
    stats,
    exchange: { date: exchange.date, stale: exchange.stale },
    period: {
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    },
  });
}
