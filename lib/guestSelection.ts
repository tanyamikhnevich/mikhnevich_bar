import type { Wine } from "./wines";
import { parseGuestPriceInput, type GuestWineUpdate } from "./guestWineApi";

/** Цена бокала для гостей: бутылка ÷ 5 + 4 (округление до целого). */
export function suggestGuestGlassPriceFromBottle(bottle: number | null): number | null {
  if (bottle == null || bottle <= 0) return null;
  return Math.round(bottle / 5 + 4);
}

export function formatGuestGlassPriceForBottle(bottlePriceStr: string): string {
  const glass = suggestGuestGlassPriceFromBottle(parseGuestPriceInput(bottlePriceStr));
  return glass != null ? String(glass) : "";
}

function isGlassPriceAuto(bottle: number | null, glass: number | null): boolean {
  if (glass == null) return false;
  const expected = suggestGuestGlassPriceFromBottle(bottle);
  return expected != null && expected === glass;
}

export type GuestSelectionRow = {
  selected: boolean;
  bottlePrice: string;
  glassPrice: string;
  /** Пользователь вручную изменил или очистил цену бокала — не пересчитывать при смене бутылки. */
  glassPriceManual: boolean;
};

export type GuestSelectionDraft = Record<string, GuestSelectionRow>;

export function buildGuestSelectionDraft(wines: Wine[]): GuestSelectionDraft {
  const draft: GuestSelectionDraft = {};
  for (const w of wines) {
    if (w.quantity <= 0) continue;
    const bottleNum =
      w.guestBottlePrice != null && Number.isFinite(w.guestBottlePrice)
        ? w.guestBottlePrice
        : null;
    const glassNum =
      w.guestGlassPrice != null && Number.isFinite(w.guestGlassPrice)
        ? w.guestGlassPrice
        : null;
    const glassPrice =
      glassNum != null ? String(glassNum) : "";
    const glassPriceManual =
      bottleNum != null && glassNum == null
        ? true
        : glassNum != null
          ? !isGlassPriceAuto(bottleNum, glassNum)
          : false;

    draft[w.id] = {
      selected: Boolean(w.isGuestVisible),
      bottlePrice: bottleNum != null ? String(bottleNum) : "",
      glassPrice,
      glassPriceManual,
    };
  }
  return draft;
}

/** Применить правку строки: авто-цена бокала при смене бутылки, пока поле не трогали вручную. */
export function patchGuestDraftRow(
  row: GuestSelectionRow,
  patch: Partial<GuestSelectionRow>,
): GuestSelectionRow {
  const next: GuestSelectionRow = { ...row, ...patch };

  if (patch.glassPrice !== undefined) {
    next.glassPriceManual = true;
  }

  if (patch.bottlePrice !== undefined && !next.glassPriceManual) {
    next.glassPrice = formatGuestGlassPriceForBottle(next.bottlePrice);
  }

  return next;
}

/** Вернуть авто-расчёт бокала по текущей цене бутылки. */
export function autoGlassPriceFromBottle(bottlePrice: string): Pick<
  GuestSelectionRow,
  "glassPrice" | "glassPriceManual"
> {
  return {
    glassPrice: formatGuestGlassPriceForBottle(bottlePrice),
    glassPriceManual: false,
  };
}

export function validateGuestSelectionDraft(
  draft: GuestSelectionDraft,
): { ok: true } | { ok: false; wineIds: string[] } {
  const wineIds: string[] = [];
  for (const [id, row] of Object.entries(draft)) {
    if (!row.selected) continue;
    const bottle = parseGuestPriceInput(row.bottlePrice);
    if (bottle == null) wineIds.push(id);
  }
  return wineIds.length > 0 ? { ok: false, wineIds } : { ok: true };
}

function guestRowFromDraft(
  w: Wine,
  row: GuestSelectionDraft[string] | undefined,
): GuestWineUpdate {
  const selected = row?.selected ?? false;
  const qty = w.quantity ?? 0;
  return {
    id: w.id,
    isGuestVisible: selected && qty > 0,
    guestBottlePrice: row
      ? parseGuestPriceInput(row.bottlePrice)
      : (w?.guestBottlePrice ?? null),
    guestGlassPrice: row ? parseGuestPriceInput(row.glassPrice) : (w?.guestGlassPrice ?? null),
  };
}

function guestRowChanged(w: Wine, next: GuestWineUpdate): boolean {
  return (
    Boolean(w.isGuestVisible) !== next.isGuestVisible ||
    (w.guestBottlePrice ?? null) !== next.guestBottlePrice ||
    (w.guestGlassPrice ?? null) !== next.guestGlassPrice
  );
}

/** Только строки, у которых изменились гостевые поля (меньше запросов к БД). */
export function guestDraftToUpdates(
  wines: Wine[],
  draft: GuestSelectionDraft,
): GuestWineUpdate[] {
  const updates: GuestWineUpdate[] = [];

  for (const w of wines) {
    if (w.quantity <= 0 && w.isGuestVisible) {
      updates.push({
        id: w.id,
        isGuestVisible: false,
        guestBottlePrice: w.guestBottlePrice ?? null,
        guestGlassPrice: w.guestGlassPrice ?? null,
      });
      continue;
    }

    const row = draft[w.id];
    if (!row) continue;

    const next = guestRowFromDraft(w, row);
    if (guestRowChanged(w, next)) updates.push(next);
  }

  return updates;
}
