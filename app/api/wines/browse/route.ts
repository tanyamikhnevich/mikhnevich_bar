import { NextResponse } from "next/server";
import type { Prisma } from "../../../../lib/generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import { toWineJson } from "../../../../lib/mapWineJson";
import {
  fetchCountryFacetOptions,
  fetchRegionFacetOptions,
  normalizeRegionFilterKey,
} from "../../../../lib/wineFacets";
import {
  needsMemorySort,
  sortWineRowsInMemory,
} from "../../../../lib/wineBrowseSort";
import {
  buildWineBrowseWhere,
  buildWineOrderBy,
  parseColorLimits,
  parseFlatPagination,
  parseWineBrowseFilters,
  WINE_COLOR_ORDER,
  WINE_TABLE_PAGE_SIZE,
  type WineColor,
} from "../../../../lib/wineQuery";
import { fetchWineTotals } from "../../../../lib/wineTotals";

function resolveCountryKeys(
  requested: string[],
  available: string[],
): string[] {
  const allowed = new Set(available);
  return requested.filter((c) => allowed.has(c));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filters = parseWineBrowseFilters(url.searchParams);
  const flat = url.searchParams.get("flat") === "1";
  const memorySort = needsMemorySort(filters.sortBy);
  const orderBy = memorySort
    ? buildWineOrderBy("name", "asc")
    : buildWineOrderBy(filters.sortBy, filters.sortDir);

  async function fetchSortedRows(
    where: Prisma.WineWhereInput,
    limit: number,
    skip = 0,
  ) {
    if (!memorySort) {
      return prisma.wine.findMany({ where, orderBy, take: limit, skip });
    }
    const rows = await prisma.wine.findMany({ where });
    const sorted = sortWineRowsInMemory(rows, filters.sortBy, filters.sortDir);
    return sorted.slice(skip, skip + limit);
  }

  const countryOptions = await fetchCountryFacetOptions(filters.drank);
  const countryKeys = resolveCountryKeys(filters.countryKeys, countryOptions);

  const singleCountry = countryKeys.length === 1 ? countryKeys[0] : "";
  const regionOptionsRaw = singleCountry
    ? await fetchRegionFacetOptions(filters.drank, singleCountry)
    : [];

  const regionKey =
    singleCountry && filters.regionKey
      ? normalizeRegionFilterKey(filters.regionKey, regionOptionsRaw)
      : "";

  const filtersResolved = { ...filters, countryKeys, regionKey };
  const totals = await fetchWineTotals();

  if (flat) {
    const { limit, offset } = parseFlatPagination(url.searchParams);
    const where = buildWineBrowseWhere(filtersResolved);
    const [items, total] = await Promise.all([
      fetchSortedRows(where, limit, offset),
      prisma.wine.count({ where }),
    ]);

    return NextResponse.json({
      totals,
      facets: {
        countries: countryOptions,
        regions: singleCountry ? regionOptionsRaw : [],
      },
      filters: { countryKeys, regionKey },
      items: items.map(toWineJson),
      total,
      limit,
      offset,
    });
  }

  const colorLimits = parseColorLimits(url.searchParams);
  const sections: Record<
    WineColor,
    { items: ReturnType<typeof toWineJson>[]; total: number; limit: number }
  > = {
    red: { items: [], total: 0, limit: WINE_TABLE_PAGE_SIZE },
    white: { items: [], total: 0, limit: WINE_TABLE_PAGE_SIZE },
    rose: { items: [], total: 0, limit: WINE_TABLE_PAGE_SIZE },
    sparkling: { items: [], total: 0, limit: WINE_TABLE_PAGE_SIZE },
  };

  await Promise.all(
    WINE_COLOR_ORDER.map(async (color) => {
      const limit = colorLimits[color] ?? WINE_TABLE_PAGE_SIZE;
      const where = buildWineBrowseWhere(filtersResolved, color);
      const [rows, total] = await Promise.all([
        fetchSortedRows(where, limit),
        prisma.wine.count({ where }),
      ]);
      sections[color] = {
        items: rows.map(toWineJson),
        total,
        limit,
      };
    }),
  );

  return NextResponse.json({
    totals,
    facets: {
      countries: countryOptions,
      regions: singleCountry ? regionOptionsRaw : [],
    },
    filters: {
      countryKeys,
      regionKey,
    },
    sections,
  });
}
