import type { Wine, WineColor } from "./wines";
import { parseDrankRating } from "./wineDrankRating";
import {
  formatWineYear,
  parseVintageFromFormInput,
  WINE_VINTAGE_NV,
} from "./wineVintage";
import {
  WINE_CURRENCY_OTHER_VALUE,
  WINE_CURRENCY_PRESETS,
  resolveWineCurrencySymbol,
} from "./wineCurrencies";
import {
  canonicalCountryCode,
  getCanonicalCountries,
  WINE_COUNTRY_OTHER_VALUE,
  WINE_REGION_OTHER_VALUE,
} from "./wineNormalize";
import { interpolate } from "./i18n/config";
import type { Dictionary } from "./i18n/dictionaries";

export type WineFormState = {
  name: string;
  producer: string;
  year: string;
  countrySelect: string;
  countryOther: string;
  regionSelect: string;
  regionOther: string;
  subregion: string;
  grape: string;
  purchasePrice: string;
  purchaseCurrencyKey: string;
  purchaseCurrencyOther: string;
  originPrice: string;
  originCurrencyKey: string;
  originCurrencyOther: string;
  israelPrice: string;
  purchaseDate: string;
  vvScore: string;
  quantity: string;
  color: WineColor;
  notes: string;
  drankAt: string;
  drankRating: string;
  drankNotes: string;
};

export function parseVvScoreFromRatings(ratings: string | null | undefined): string {
  const r = (ratings ?? "").trim();
  if (!r) return "";
  const m = r.match(/(?:VV|Vivino)\s*([\d]+(?:[.,]\d+)?)/i);
  if (m?.[1]) return m[1].replace(",", ".");
  return "";
}

export function currencyKeyFromSymbol(symbol: string | null | undefined): {
  key: string;
  other: string;
} {
  const s = (symbol ?? "").trim();
  if (!s) return { key: "ILS", other: "" };
  const preset = WINE_CURRENCY_PRESETS.find((p) => p.symbol === s);
  if (preset) return { key: preset.key, other: "" };
  return { key: WINE_CURRENCY_OTHER_VALUE, other: s };
}

export function countrySelectFromWine(
  country: string | null | undefined,
  countryOptions: string[],
): { select: string; other: string } {
  const c = (country ?? "").trim();
  if (!c) return { select: "", other: "" };
  if (countryOptions.includes(c)) return { select: c, other: "" };
  const canonical = getCanonicalCountries().find((x) => x.name === c);
  if (canonical && countryOptions.includes(canonical.name)) {
    return { select: canonical.name, other: "" };
  }
  return { select: WINE_COUNTRY_OTHER_VALUE, other: c };
}

export function regionSelectFromWine(
  region: string | null | undefined,
  regionOptions: string[],
): { select: string; other: string } {
  const r = (region ?? "").trim();
  if (!r) return { select: "", other: "" };
  if (regionOptions.includes(r)) return { select: r, other: "" };
  return { select: WINE_REGION_OTHER_VALUE, other: r };
}

export function wineToFormState(
  wine: Wine,
  countryOptions: string[],
  regionOptions: string[],
): WineFormState {
  const { select: countrySelect, other: countryOther } = countrySelectFromWine(
    wine.country,
    countryOptions,
  );
  const { select: regionSelect, other: regionOther } = regionSelectFromWine(
    wine.region,
    regionOptions,
  );
  const purchaseCur = currencyKeyFromSymbol(wine.purchaseCurrency);
  const originCur = currencyKeyFromSymbol(wine.originCurrency);

  return {
    name: wine.name ?? "",
    producer: wine.producer ?? "",
    year: wine.year?.trim() ? formatWineYear(wine.year) : "",
    countrySelect,
    countryOther,
    regionSelect,
    regionOther,
    subregion: wine.subregion ?? "",
    grape: wine.grape ?? "",
    purchasePrice:
      wine.purchasePrice != null ? String(wine.purchasePrice) : "",
    purchaseCurrencyKey: purchaseCur.key,
    purchaseCurrencyOther: purchaseCur.other,
    originPrice: wine.originPrice != null ? String(wine.originPrice) : "",
    originCurrencyKey: originCur.key,
    originCurrencyOther: originCur.other,
    israelPrice: wine.israelPrice != null ? String(wine.israelPrice) : "",
    purchaseDate: wine.purchaseDate ?? "",
    vvScore: parseVvScoreFromRatings(wine.ratings),
    quantity: String(wine.quantity > 0 ? wine.quantity : 1),
    color: wine.color,
    notes: wine.notes ?? "",
    drankAt: wine.drankAt?.slice(0, 10) ?? "",
    drankRating:
      wine.drankRating != null && Number.isFinite(wine.drankRating)
        ? String(wine.drankRating)
        : "",
    drankNotes: wine.drankNotes?.trim() ?? "",
  };
}

export function resolveFormGeo(form: WineFormState) {
  const isCountryOther = form.countrySelect === WINE_COUNTRY_OTHER_VALUE;
  const country = isCountryOther
    ? form.countryOther.trim()
    : form.countrySelect.trim();
  const isRegionOther = form.regionSelect === WINE_REGION_OTHER_VALUE;
  const region = isCountryOther
    ? form.regionOther.trim()
    : isRegionOther
      ? form.regionOther.trim()
      : form.regionSelect.trim();
  return { country, region, isCountryOther };
}

export function parsePositiveInt(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  return rounded >= 1 ? rounded : null;
}

export function parsePositivePrice(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function formatRatingsFromVvScore(score: string): string | null {
  const t = score.trim().replace(",", ".");
  if (!t) return null;
  return `VV ${t}`;
}

export function validateWineForm(
  form: WineFormState,
  resolvedCountry: string,
  resolvedRegion: string,
  t: Dictionary["form"],
): string | null {
  if (!form.name.trim()) return t.nameRequired;
  if (!form.producer.trim()) return t.producerRequired;
  if (!form.year.trim()) return t.yearOrNv;
  if (parseVintageFromFormInput(form.year) == null) {
    return interpolate(t.yearRange, { nv: WINE_VINTAGE_NV });
  }
  if (!form.countrySelect) return t.selectCountry;
  if (form.countrySelect === WINE_COUNTRY_OTHER_VALUE && !form.countryOther.trim()) {
    return t.countryNameRequired;
  }
  if (!resolvedCountry) return t.countryRequired;
  if (!resolvedRegion) return t.regionRequired;
  if (!parsePositiveInt(form.quantity)) return t.quantityMin1;
  if (parsePositivePrice(form.purchasePrice) == null) return t.purchasePriceRequired;
  if (
    !resolveWineCurrencySymbol(
      form.purchaseCurrencyKey,
      form.purchaseCurrencyOther,
    )
  ) {
    return t.selectPurchaseCurrency;
  }
  if (parsePositivePrice(form.originPrice) == null) {
    return t.originPriceRequired;
  }
  if (
    !resolveWineCurrencySymbol(form.originCurrencyKey, form.originCurrencyOther)
  ) {
    return t.selectOriginCurrency;
  }
  if (!form.purchaseDate.trim()) return t.purchaseDateRequired;
  return null;
}

export function formStateToUpdateBody(
  form: WineFormState,
  options?: { includeDrankMeta?: boolean },
) {
  const { country, region, isCountryOther } = resolveFormGeo(form);
  const israelPrice = form.israelPrice.trim()
    ? parsePositivePrice(form.israelPrice)
    : null;

  const body: Record<string, unknown> = {
    name: form.name.trim(),
    producer: form.producer.trim(),
    year: parseVintageFromFormInput(form.year),
    country,
    countryCode: isCountryOther
      ? ""
      : canonicalCountryCode(form.countrySelect) ?? "",
    region,
    subregion: form.subregion.trim() || null,
    grape: form.grape.trim() || null,
    ratings: formatRatingsFromVvScore(form.vvScore),
    purchasePrice: parsePositivePrice(form.purchasePrice),
    purchaseCurrency: resolveWineCurrencySymbol(
      form.purchaseCurrencyKey,
      form.purchaseCurrencyOther,
    ),
    originPrice: parsePositivePrice(form.originPrice),
    originCurrency: resolveWineCurrencySymbol(
      form.originCurrencyKey,
      form.originCurrencyOther,
    ),
    israelPrice,
    israelCurrency: israelPrice != null ? "₪" : null,
    purchaseDate: form.purchaseDate.trim() || null,
    quantity: parsePositiveInt(form.quantity) ?? 1,
    color: form.color,
    notes: form.notes.trim() || null,
  };

  if (options?.includeDrankMeta) {
    body.drankAt = form.drankAt.trim() || null;
    const ratingRaw = form.drankRating.trim();
    body.drankRating = ratingRaw ? parseDrankRating(ratingRaw) : null;
    body.drankNotes = form.drankNotes.trim() || null;
  }

  return body;
}
