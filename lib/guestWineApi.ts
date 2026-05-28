export type GuestWineUpdate = {
  id: string;
  isGuestVisible: boolean;
  guestBottlePrice: number | null;
  guestGlassPrice: number | null;
};

export function parseGuestPriceInput(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function validateGuestWineUpdates(
  items: GuestWineUpdate[],
): { ok: true } | { ok: false; message: string; wineIds: string[] } {
  const wineIds: string[] = [];
  for (const item of items) {
    if (!item.isGuestVisible) continue;
    if (item.guestBottlePrice == null || !Number.isFinite(item.guestBottlePrice)) {
      wineIds.push(item.id);
    }
  }
  if (wineIds.length > 0) {
    return {
      ok: false,
      message: "Для каждого выбранного вина укажите цену за бутылку",
      wineIds,
    };
  }
  return { ok: true };
}
