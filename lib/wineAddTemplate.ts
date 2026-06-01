import type { Wine, WineColor } from "./wines";
import { displayNotes } from "./wines";
import {
  WINE_CURRENCY_OTHER_VALUE,
  WINE_CURRENCY_PRESETS,
} from "./wineCurrencies";
import {
  getCanonicalCountries,
  WINE_COUNTRY_OTHER_VALUE,
  WINE_REGION_OTHER_VALUE,
} from "./wineNormalize";
import { formatWineYear } from "./wineVintage";

export type WineAddFormDefaults = {
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
};

function todayISODateLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function priceToStr(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return String(Math.round(n));
}

function currencyToFormKey(symbol: string | null | undefined): {
  key: string;
  other: string;
} {
  const s = (symbol ?? "").trim();
  if (!s) return { key: "ILS", other: "" };
  const preset = WINE_CURRENCY_PRESETS.find(
    (p) => p.symbol === s || p.key.toUpperCase() === s.toUpperCase(),
  );
  if (preset) return { key: preset.key, other: "" };
  return { key: WINE_CURRENCY_OTHER_VALUE, other: s };
}

function parseVvScore(ratings: string | null | undefined, vivino: number | null | undefined): string {
  const r = (ratings ?? "").trim();
  const m = r.match(/VV\s*([\d.,]+)/i);
  if (m?.[1]) return m[1].replace(",", ".");
  if (vivino != null && Number.isFinite(vivino)) return String(vivino);
  return "";
}

function resolveCountry(country: string | null | undefined): {
  countrySelect: string;
  countryOther: string;
} {
  const c = (country ?? "").trim();
  if (!c) return { countrySelect: "", countryOther: "" };
  const canonical = getCanonicalCountries();
  if (canonical.some((x) => x.name === c)) {
    return { countrySelect: c, countryOther: "" };
  }
  return { countrySelect: WINE_COUNTRY_OTHER_VALUE, countryOther: c };
}

function resolveRegion(
  region: string | null | undefined,
  countrySelect: string,
  countryOther: string,
): { regionSelect: string; regionOther: string } {
  const r = (region ?? "").trim();
  if (!r) return { regionSelect: "", regionOther: "" };
  if (countrySelect === WINE_COUNTRY_OTHER_VALUE) {
    return { regionSelect: "", regionOther: r };
  }
  return { regionSelect: r, regionOther: "" };
}

/** Поля формы «Добавить вино» из существующей записи (без id, quantity=1 по умолчанию). */
export function wineToAddFormDefaults(w: Wine): WineAddFormDefaults {
  const purchaseCur = currencyToFormKey(w.purchaseCurrency);
  const originCur = currencyToFormKey(w.originCurrency);
  const { countrySelect, countryOther } = resolveCountry(w.country);
  const { regionSelect, regionOther } = resolveRegion(
    w.region,
    countrySelect,
    countryOther,
  );

  const yearFormatted = formatWineYear(w.year);

  return {
    name: w.name?.trim() ?? "",
    producer: w.producer?.trim() ?? "",
    year: yearFormatted === "—" ? "" : yearFormatted,
    countrySelect,
    countryOther,
    regionSelect,
    regionOther,
    subregion: w.subregion?.trim() ?? "",
    grape: w.grape?.trim() ?? "",
    purchasePrice: priceToStr(w.purchasePrice),
    purchaseCurrencyKey: purchaseCur.key,
    purchaseCurrencyOther: purchaseCur.other,
    originPrice: priceToStr(w.originPrice),
    originCurrencyKey: originCur.key,
    originCurrencyOther: originCur.other,
    israelPrice: priceToStr(w.israelPrice),
    purchaseDate: w.purchaseDate?.trim() || todayISODateLocal(),
    vvScore: parseVvScore(w.ratings, w.vivinoRating ?? null),
    quantity: "1",
    color: w.color,
    notes: displayNotes(w.notes) ?? "",
  };
}

export { WINE_REGION_OTHER_VALUE };
