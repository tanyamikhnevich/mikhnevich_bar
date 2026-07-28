"use client";

import { useState } from "react";
import {
  autoGlassPriceFromBottle,
  type GuestSelectionDraft,
} from "@/lib/guestSelection";
import type { Wine } from "@/lib/wines";
import {
  displayNotes,
  displayRatings,
  formatAmountWithCurrency,
  formatDateRU,
  formatTableAmount,
  formatWineYear,
} from "@/lib/wines";
import { countryCodeToFlagEmoji } from "@/lib/wineUtils";
import { formatDrankRating } from "@/lib/wineDrankRating";
import {
  drankDisplayFromExcel,
  type DrankExcelMetaEntry,
} from "@/lib/myWinesXlsxDrankMeta";
import drankExcelMetaFile from "@/data/drank-excel-meta.json";
import { WineRowEditor } from "./WineRowEditor";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWineSelection } from "./WineSelectionContext";

const EXCEL_META_BY_ROW = drankExcelMetaFile.byRow as Record<
  string,
  DrankExcelMetaEntry
>;

function MetaLine({ parts }: { parts: (string | null | undefined)[] }) {
  const line = parts.filter((p) => p && String(p).trim() && p !== "—").join(" · ");
  if (!line) return null;
  return <p className="mt-1 text-sm text-zinc-600">{line}</p>;
}

function PriceChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-zinc-50 px-2.5 py-2 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

type CollectionProps = {
  variant: "collection" | "drank";
  wines: Wine[];
  countryOptions?: string[];
  onDrink?: (wine: Wine) => void;
  onRestore?: (wine: Wine) => void;
  onUpdate?: (wine: Wine, patch: Record<string, unknown>) => void | Promise<void>;
  onDelete?: (wine: Wine) => void | Promise<void>;
};

type GuestProps = {
  variant: "guest";
  wines: Wine[];
};

type GuestSelectProps = {
  variant: "guestSelect";
  wines: Wine[];
  guestSelection: {
    draft: GuestSelectionDraft;
    onDraftChange: (id: string, patch: Partial<GuestSelectionDraft[string]>) => void;
    invalidIds?: Set<string>;
  };
};

export type WineMobileListProps = CollectionProps | GuestProps | GuestSelectProps;

export function WineMobileList(props: WineMobileListProps) {
  const { wines, variant } = props;
  const { t, fmt } = useI18n();
  const selection = useWineSelection();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (wines.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-zinc-500 md:hidden">{t.common.empty}</div>
    );
  }

  const handleDelete = async (wine: Wine, onDelete: (w: Wine) => void | Promise<void>) => {
    const label = wine.name?.trim() || t.table.thisRecord;
    if (!window.confirm(fmt(t.table.confirmDelete, { name: label }))) {
      return;
    }
    setDeletingId(wine.id);
    try {
      await onDelete(wine);
      if (editingId === wine.id) setEditingId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ul className="divide-y divide-zinc-100 md:hidden">
      {wines.map((w) => {
        const flag = countryCodeToFlagEmoji(w.countryCode);
        const country = (w.country && w.country.trim()) || "";
        const extra = displayNotes(w.notes);
        const ratings = displayRatings(w);

        if (variant === "guest") {
          return (
            <li key={w.id} className="px-4 py-4">
              <p className="font-semibold leading-snug text-zinc-900">{w.name || "—"}</p>
              <p className="mt-0.5 text-sm text-zinc-600">{w.producer || "—"}</p>
              <MetaLine
                parts={[
                  flag ? `${flag} ${country}` : country,
                  formatWineYear(w.year),
                  w.region,
                  w.subregion,
                  w.grape,
                ]}
              />
              {ratings ? (
                <p className="mt-1 text-sm text-zinc-600">{t.table.ratingLabel}: {ratings}</p>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <PriceChip
                  label={t.table.bottle}
                  value={formatTableAmount(w.guestBottlePrice)}
                />
                <PriceChip
                  label={t.table.glass}
                  value={formatTableAmount(w.guestGlassPrice)}
                />
              </div>
            </li>
          );
        }

        if (variant === "guestSelect") {
          const { draft, onDraftChange, invalidIds } = props.guestSelection;
          const row = draft[w.id];
          const outOfStock = w.quantity <= 0;
          const invalid = invalidIds?.has(w.id);

          return (
            <li
              key={w.id}
              className={[
                "px-4 py-4",
                outOfStock ? "bg-zinc-50/90 opacity-70" : "",
                invalid ? "bg-red-50/50" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {outOfStock ? (
                <p className="text-sm text-zinc-500">{fmt(t.guestSelect.outOfStockName, { name: w.name })}</p>
              ) : (
                <>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={row?.selected ?? false}
                      onChange={(e) =>
                        onDraftChange(w.id, { selected: e.target.checked })
                      }
                      className="mt-1 size-5 shrink-0 rounded border-zinc-300 text-rose-700 focus:ring-rose-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug text-zinc-900">
                        {w.name || "—"}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-600">
                        {w.producer || "—"} · {fmt(t.table.pieces, { count: w.quantity })}
                      </p>
                    </div>
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-3 pl-8">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-zinc-600">
                        {t.guestSelect.pricePerBottle}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row?.bottlePrice ?? ""}
                        onChange={(e) =>
                          onDraftChange(w.id, { bottlePrice: e.target.value })
                        }
                        disabled={!(row?.selected ?? false)}
                        placeholder="—"
                        className={[
                          "h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900",
                          invalid ? "border-red-400 bg-red-50" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                      {invalid ? (
                        <p className="mt-1 text-xs text-red-600">{t.table.enterPrice}</p>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-zinc-600">
                        {t.guestSelect.pricePerGlass}
                      </span>
                      <span className="mb-1 block text-[10px] leading-snug text-zinc-500">
                        {t.guestSelect.glassHint}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row?.glassPrice ?? ""}
                        onChange={(e) =>
                          onDraftChange(w.id, { glassPrice: e.target.value })
                        }
                        disabled={!(row?.selected ?? false)}
                        placeholder={row?.glassPriceManual ? "—" : t.table.auto}
                        className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900"
                      />
                      {row?.glassPriceManual &&
                      row?.bottlePrice &&
                      (row?.selected ?? false) ? (
                        <button
                          type="button"
                          onClick={() =>
                            onDraftChange(w.id, autoGlassPriceFromBottle(row.bottlePrice))
                          }
                          className="mt-1 text-xs font-medium text-rose-700 hover:underline"
                        >
                          {t.guestSelect.fillByFormula}
                        </button>
                      ) : null}
                    </label>
                  </div>
                </>
              )}
            </li>
          );
        }

        const {
          countryOptions = [],
          onDrink,
          onRestore,
          onUpdate,
          onDelete,
        } = props;
        const isEditing = editingId === w.id;
        const isBusy = savingId === w.id || deletingId === w.id;
        const hasActions = Boolean(onDrink || onRestore || onUpdate || onDelete);
        const drankDisplay =
          variant === "drank"
            ? drankDisplayFromExcel(w, EXCEL_META_BY_ROW)
            : null;

        const selected = selection.active && selection.isSelected(w.id);

        return (
          <li
            key={w.id}
            className={[
              "px-4 py-4",
              selection.active ? "cursor-pointer" : "",
              selected ? "bg-rose-50" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={
              selection.active ? () => selection.toggle(w.id) : undefined
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-zinc-900">
                  {selection.active ? (
                    <span
                      className={`mr-1.5 ${selected ? "text-rose-700" : "text-zinc-300"}`}
                      aria-hidden
                    >
                      {selected ? "✓" : "○"}
                    </span>
                  ) : null}
                  {w.name || "—"}
                </p>
                <p className="mt-0.5 text-sm text-zinc-600">{w.producer || "—"}</p>
              </div>
              {variant === "collection" ? (
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-sm font-semibold text-zinc-800">
                  {fmt(t.table.pieces, { count: w.quantity })}
                </span>
              ) : null}
            </div>

            <MetaLine
              parts={[
                flag ? `${flag} ${country}` : country,
                formatWineYear(w.year),
                w.region,
                w.subregion,
              ]}
            />
            {w.grape ? <p className="mt-1 text-sm text-zinc-500">{w.grape}</p> : null}
            {ratings ? (
              <p className="mt-1 text-sm text-zinc-600">{t.table.ratingLabel}: {ratings}</p>
            ) : null}
            {variant === "drank" && drankDisplay?.rating != null ? (
              <p className="mt-1 text-sm text-zinc-600">
                {t.table.myScoreLabel}: {formatDrankRating(drankDisplay.rating)}
              </p>
            ) : null}
            {variant === "drank" && drankDisplay?.notes ? (
              <p className="mt-1 text-xs text-zinc-500">{drankDisplay.notes}</p>
            ) : null}
            {extra && variant === "collection" ? (
              <p className="mt-1 text-xs text-zinc-500">{extra}</p>
            ) : null}
            <p className="mt-1 text-xs text-zinc-500">
              {variant === "drank" ? t.rowEditor.drankAt : t.table.purchase}:{" "}
              {variant === "drank"
                ? w.drankAt
                  ? formatDateRU(w.drankAt.slice(0, 10))
                  : "—"
                : formatDateRU(w.purchaseDate)}
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <PriceChip
                label={t.table.purchase}
                value={formatAmountWithCurrency(w.purchasePrice, w.purchaseCurrency)}
              />
              <PriceChip
                label={t.table.israel}
                value={formatAmountWithCurrency(w.israelPrice, w.israelCurrency)}
              />
              <PriceChip
                label={t.table.origin}
                value={formatAmountWithCurrency(w.originPrice, w.originCurrency)}
              />
            </div>

            {hasActions && !isEditing ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {variant === "drank" || w.drank
                  ? onRestore && (
                      <button
                        type="button"
                        onClick={() => void onRestore(w)}
                        disabled={isBusy}
                        className="min-h-11 flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 active:bg-emerald-100 disabled:opacity-50"
                      >
                        {t.common.restore}
                      </button>
                    )
                  : onDrink && (
                      <button
                        type="button"
                        onClick={() => void onDrink(w)}
                        disabled={isBusy}
                        className="min-h-11 flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-800 active:bg-rose-100 disabled:opacity-50"
                      >
                        {t.common.drink}
                      </button>
                    )}
                {onUpdate ? (
                  <button
                    type="button"
                    onClick={() => setEditingId(w.id)}
                    disabled={isBusy}
                    className="min-h-11 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 active:bg-zinc-50 disabled:opacity-50"
                    aria-label={t.common.edit}
                  >
                    {t.common.edit}
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete(w, onDelete)}
                    disabled={isBusy}
                    className="min-h-11 rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-700 active:bg-red-50 disabled:opacity-50"
                  >
                    {t.common.delete}
                  </button>
                ) : null}
              </div>
            ) : null}

            {isEditing && onUpdate ? (
              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <WineRowEditor
                  wine={w}
                  variant={variant}
                  countryOptions={countryOptions}
                  saving={savingId === w.id}
                  onCancel={() => setEditingId(null)}
                  onSave={async (patch) => {
                    setSavingId(w.id);
                    try {
                      await onUpdate(w, patch);
                      setEditingId(null);
                    } catch (e) {
                      alert(e instanceof Error ? e.message : String(e));
                      throw e;
                    } finally {
                      setSavingId(null);
                    }
                  }}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
