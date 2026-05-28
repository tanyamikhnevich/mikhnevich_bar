import type { Wine } from "./wines";
import { parseGuestPriceInput, type GuestWineUpdate } from "./guestWineApi";

export type GuestSelectionDraft = Record<
  string,
  {
    selected: boolean;
    bottlePrice: string;
    glassPrice: string;
  }
>;

export function buildGuestSelectionDraft(wines: Wine[]): GuestSelectionDraft {
  const draft: GuestSelectionDraft = {};
  for (const w of wines) {
    if (w.quantity <= 0) continue;
    draft[w.id] = {
      selected: Boolean(w.isGuestVisible),
      bottlePrice:
        w.guestBottlePrice != null && Number.isFinite(w.guestBottlePrice)
          ? String(w.guestBottlePrice)
          : "",
      glassPrice:
        w.guestGlassPrice != null && Number.isFinite(w.guestGlassPrice)
          ? String(w.guestGlassPrice)
          : "",
    };
  }
  return draft;
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
