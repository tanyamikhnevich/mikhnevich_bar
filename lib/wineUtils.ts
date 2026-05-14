/** Shared helpers (no "use client") for API and scripts. */

/** Флаг страны по ISO 3166-1 alpha-2 (эмодзи региональных индикаторов). */
export function countryCodeToFlagEmoji(iso2: string | null | undefined): string {
  if (iso2 == null) return "";
  const code = iso2
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (code.length !== 2) return "";
  const base = 0x1f1e6;
  const chars = [...code];
  const a = "A".charCodeAt(0);
  return String.fromCodePoint(
    base + (chars[0].charCodeAt(0) - a),
    base + (chars[1].charCodeAt(0) - a),
  );
}

export function parseVivinoFromRatings(ratings: string | null | undefined): number | null {
  if (ratings === null || ratings === undefined) return null;
  const s = String(ratings).trim();
  if (!s || s === "-" || s === "—" || s === "?") return null;
  // «VV4.2» и «VV 4.2»
  const m = s.match(/(?:VV|Vivino)\s*([\d]+(?:[.,]\d+)?)/i);
  if (m) {
    const v = Number(m[1].replace(",", "."));
    if (Number.isFinite(v) && v >= 0 && v <= 5) return v;
  }
  return null;
}
