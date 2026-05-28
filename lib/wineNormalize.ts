/** Нормализация географии и текстовых полей вина (API, импорт, миграция). */

export type NormalizedGeo = {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  subregion: string | null;
  grape: string | null;
};

const ISO_TO_COUNTRY: Record<string, string> = {
  IT: "Italy",
  FR: "France",
  IL: "Israel",
  ES: "Spain",
  US: "USA",
  PT: "Portugal",
  AU: "Australia",
  AR: "Argentina",
  CL: "Chile",
  DE: "Germany",
  NZ: "New Zealand",
  GB: "UK",
  JP: "Japan",
  IE: "Ireland",
  GR: "Greece",
  GE: "Georgia",
  HU: "Hungary",
  AT: "Austria",
  MD: "Moldova",
  RO: "Romania",
  UY: "Uruguay",
  ZA: "South Africa",
  CA: "Canada",
  CN: "China",
  LB: "Lebanon",
};

/** Ключ — lower-case alias; значение — каноническое имя и ISO. */
const COUNTRY_ALIASES: Record<string, { country: string; code: string }> = {
  italy: { country: "Italy", code: "IT" },
  italia: { country: "Italy", code: "IT" },
  италия: { country: "Italy", code: "IT" },
  france: { country: "France", code: "FR" },
  франция: { country: "France", code: "FR" },
  israel: { country: "Israel", code: "IL" },
  израиль: { country: "Israel", code: "IL" },
  spain: { country: "Spain", code: "ES" },
  испания: { country: "Spain", code: "ES" },
  usa: { country: "USA", code: "US" },
  us: { country: "USA", code: "US" },
  "united states": { country: "USA", code: "US" },
  сша: { country: "USA", code: "US" },
  portugal: { country: "Portugal", code: "PT" },
  португалия: { country: "Portugal", code: "PT" },
  australia: { country: "Australia", code: "AU" },
  австралия: { country: "Australia", code: "AU" },
  argentina: { country: "Argentina", code: "AR" },
  аргентина: { country: "Argentina", code: "AR" },
  chile: { country: "Chile", code: "CL" },
  чили: { country: "Chile", code: "CL" },
  germany: { country: "Germany", code: "DE" },
  германия: { country: "Germany", code: "DE" },
  "new zealand": { country: "New Zealand", code: "NZ" },
  uk: { country: "UK", code: "GB" },
  "united kingdom": { country: "UK", code: "GB" },
  england: { country: "UK", code: "GB" },
  scotland: { country: "UK", code: "GB" },
  великобритания: { country: "UK", code: "GB" },
  japan: { country: "Japan", code: "JP" },
  япония: { country: "Japan", code: "JP" },
  ireland: { country: "Ireland", code: "IE" },
  ирландия: { country: "Ireland", code: "IE" },
  greece: { country: "Greece", code: "GR" },
  греция: { country: "Greece", code: "GR" },
  georgia: { country: "Georgia", code: "GE" },
  грузия: { country: "Georgia", code: "GE" },
  hungary: { country: "Hungary", code: "HU" },
  венгрия: { country: "Hungary", code: "HU" },
  austria: { country: "Austria", code: "AT" },
  австрия: { country: "Austria", code: "AT" },
  moldova: { country: "Moldova", code: "MD" },
  молдова: { country: "Moldova", code: "MD" },
  romania: { country: "Romania", code: "RO" },
  румыния: { country: "Romania", code: "RO" },
  uruguay: { country: "Uruguay", code: "UY" },
  уругвай: { country: "Uruguay", code: "UY" },
  "south africa": { country: "South Africa", code: "ZA" },
  "юар": { country: "South Africa", code: "ZA" },
  "южная африка": { country: "South Africa", code: "ZA" },
  canada: { country: "Canada", code: "CA" },
  канада: { country: "Canada", code: "CA" },
  china: { country: "China", code: "CN" },
  китай: { country: "China", code: "CN" },
  lebanon: { country: "Lebanon", code: "LB" },
  ливан: { country: "Lebanon", code: "LB" },
};

export function normalizeWineText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = String(value).trim().replace(/\s+/g, " ");
  return t || null;
}

function titleCaseSegment(segment: string): string {
  if (!segment) return segment;
  if (segment.length <= 3 && segment === segment.toUpperCase()) return segment;
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

/** Регион / субрегион / сорт: trim + Title Case по словам. */
export function normalizePlaceName(value: string | null | undefined): string | null {
  const t = normalizeWineText(value);
  if (!t) return null;
  return t
    .split(/(\s+|[-/])/)
    .map((part) => {
      if (!part.trim() || /^[\s\-/]+$/.test(part)) return part;
      return part
        .split(/(['’])/)
        .map((p, i) => (i % 2 === 1 ? p : titleCaseSegment(p)))
        .join("");
    })
    .join("");
}

function resolveCountryAlias(raw: string): { country: string; code: string } | null {
  const key = raw.trim().toLowerCase();
  if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key];
  if (key.length === 2 && ISO_TO_COUNTRY[key.toUpperCase()]) {
    const code = key.toUpperCase();
    return { country: ISO_TO_COUNTRY[code], code };
  }
  return null;
}

export function normalizeCountryFields(
  country: string | null | undefined,
  countryCode: string | null | undefined,
): Pick<NormalizedGeo, "country" | "countryCode"> {
  const rawCountry = normalizeWineText(country);
  const rawCode = normalizeWineText(countryCode)?.toUpperCase().replace(/[^A-Z]/g, "") ?? null;
  const code2 = rawCode && rawCode.length === 2 ? rawCode : null;

  if (rawCountry) {
    const alias = resolveCountryAlias(rawCountry);
    if (alias) {
      return {
        country: alias.country,
        countryCode: code2 && code2 !== alias.code ? code2 : alias.code,
      };
    }
    const titled = titleCaseSegment(rawCountry);
    const derivedCode = code2 ?? countryNameToIso(titled);
    return { country: titled, countryCode: derivedCode };
  }

  if (code2 && ISO_TO_COUNTRY[code2]) {
    return { country: ISO_TO_COUNTRY[code2], countryCode: code2 };
  }

  return { country: null, countryCode: code2 };
}

function countryNameToIso(country: string): string | null {
  const alias = resolveCountryAlias(country);
  return alias?.code ?? null;
}

export function normalizeWineGeo(input: {
  country?: string | null;
  countryCode?: string | null;
  region?: string | null;
  subregion?: string | null;
  grape?: string | null;
}): NormalizedGeo {
  const { country, countryCode } = normalizeCountryFields(
    input.country,
    input.countryCode,
  );
  return {
    country,
    countryCode,
    region: normalizePlaceName(input.region),
    subregion: normalizePlaceName(input.subregion),
    grape: normalizePlaceName(input.grape),
  };
}

/** Ключ фильтра по стране (каноническое имя). */
export function wineCountryFilterKey(
  country: string | null | undefined,
  countryCode: string | null | undefined,
): string | null {
  const { country: c } = normalizeCountryFields(country, countryCode);
  return c;
}

const CANONICAL_COUNTRY_BY_NAME: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const { country, code } of Object.values(COUNTRY_ALIASES)) {
    map.set(country, code);
  }
  for (const [code, country] of Object.entries(ISO_TO_COUNTRY)) {
    map.set(country, code);
  }
  return map;
})();

/** Справочник стран для форм (канонические имена + ISO). */
export function getCanonicalCountries(): Array<{ name: string; code: string }> {
  return [...CANONICAL_COUNTRY_BY_NAME.entries()]
    .map(([name, code]) => ({ name, code }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export function canonicalCountryCode(name: string): string | null {
  return CANONICAL_COUNTRY_BY_NAME.get(name) ?? null;
}

export const WINE_COUNTRY_OTHER_VALUE = "__other__";
export const WINE_REGION_OTHER_VALUE = "__other__";
