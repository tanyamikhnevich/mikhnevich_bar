export const WINE_CURRENCY_OTHER_VALUE = "__other__";

export const WINE_CURRENCY_PRESETS = [
  { key: "ILS", symbol: "₪", label: "₪ шекель" },
  { key: "USD", symbol: "$", label: "$ доллар" },
  { key: "EUR", symbol: "€", label: "€ евро" },
  { key: "RUB", symbol: "₽", label: "₽ рубль" },
] as const;

export type WineCurrencyPresetKey = (typeof WINE_CURRENCY_PRESETS)[number]["key"];

export function resolveWineCurrencySymbol(
  key: string,
  otherText: string,
): string {
  if (key === WINE_CURRENCY_OTHER_VALUE) {
    const t = otherText.trim();
    return t ? t.slice(0, 8) : "";
  }
  const preset = WINE_CURRENCY_PRESETS.find((p) => p.key === key);
  return preset?.symbol ?? "₪";
}
