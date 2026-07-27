import { prisma } from "./prisma";
import { normalizePlaceName } from "./wineNormalize";

export async function fetchCountryFacetOptions(
  userId: string,
  drank: boolean,
): Promise<string[]> {
  const rows = await prisma.wine.findMany({
    where: { userId, drank, country: { not: null } },
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  });
  return rows
    .map((r) => r.country)
    .filter((c): c is string => Boolean(c?.trim()));
}

export async function fetchRegionFacetOptions(
  userId: string,
  drank: boolean,
  countryKey: string,
): Promise<string[]> {
  if (!countryKey.trim()) return [];
  const rows = await prisma.wine.findMany({
    where: {
      userId,
      drank,
      country: countryKey,
      region: { not: null },
    },
    select: { region: true },
    distinct: ["region"],
    orderBy: { region: "asc" },
  });
  return rows
    .map((r) => r.region)
    .filter((c): c is string => Boolean(c?.trim()));
}

/** Проверка, что значение региона допустимо для выбранной страны. */
export function normalizeRegionFilterKey(
  raw: string,
  options: string[],
): string {
  const key = normalizePlaceName(raw) ?? "";
  if (!key) return "";
  return options.includes(key) ? key : "";
}
