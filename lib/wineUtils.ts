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

/** Год урожая: число как строка или метки вроде N.V. */
export function normalizeWineYear(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const y = Math.round(raw);
    if (y < 1800 || y > 2100) return null;
    return String(y);
  }
  const s = String(raw).trim();
  if (!s || s === "-" || s === "—") return null;
  if (/^(N\.V\.|NV|NAS|N\/A)$/i.test(s)) return "N.V.";
  const n = Number(s.replace(",", "."));
  if (Number.isFinite(n)) {
    const y = Math.round(n);
    if (y >= 1800 && y <= 2100) return String(y);
  }
  if (s.length <= 12) return s;
  return null;
}

export function compareWineYears(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const na = a != null && /^\d{4}$/.test(a) ? Number(a) : null;
  const nb = b != null && /^\d{4}$/.test(b) ? Number(b) : null;
  if (na != null && nb != null) return na - nb;
  if (na != null) return -1;
  if (nb != null) return 1;
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, "ru");
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
