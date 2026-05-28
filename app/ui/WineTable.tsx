"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";
import type { GuestSelectionDraft } from "../../lib/guestSelection";
import type { Wine } from "../../lib/wines";
import {
  displayNotes,
  displayRatings,
  formatAmountWithCurrency,
  formatDateRU,
  formatWineYear,
  formatTableAmount,
} from "../../lib/wines";
import { countryCodeToFlagEmoji } from "../../lib/wineUtils";
import { WineRowEditor } from "./WineRowEditor";

const ROW_H = "h-[4.5rem]";
const ROW_MAX = "max-h-[4.5rem]";

const cellBase =
  "min-w-0 select-text align-middle text-zinc-800 overflow-visible";
const cellCenter = `${cellBase} text-center`;

/** Доли ширины (сумма 100%). */
const COL_PCT = [
  5.5, 15.5, 9.5, 2.5, 6.5, 6.5, 8, 7.5, 5, 6.5, 6, 6, 3, 14,
const COL_PCT_COLLECTION = [
  5.5, 10, 13, 3, 9, 8, 7, 6.5, 8.5, 6.5, 6, 6, 3.5, 7.5,
] as const;

const TOOLTIP_BOX =
  "pointer-events-none absolute bottom-full z-[100] mb-1 hidden w-max max-w-[min(18rem,calc(100vw-2rem))] whitespace-normal rounded border border-zinc-300/90 bg-zinc-100 px-2.5 py-1.5 text-left text-[10px] font-normal leading-snug text-zinc-800 shadow-md group-hover:block sm:text-[11px]";

function isElementOverflowing(el: HTMLElement) {
  return (
    el.scrollHeight > el.clientHeight + 1 ||
    el.scrollWidth > el.clientWidth + 1
  );
}

function useIsOverflowing<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      setIsOverflowing(false);
      return;
    }

    const measure = () => setIsOverflowing(isElementOverflowing(el));
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remeasure when content/layout inputs change
  }, deps);

  return { ref, isOverflowing };
}

function ClampedText({
  text,
  lines,
  className = "",
  tooltip,
  tooltipAlign = "center",
}: {
  text: string | null | undefined;
  lines: 2 | 3;
  className?: string;
  tooltip?: string;
  tooltipAlign?: "center" | "left";
}) {
  const value = (text && String(text).trim()) || "—";
  const tipText = (tooltip && tooltip.trim()) || (value !== "—" ? value : "");
  const clamp = lines === 2 ? "line-clamp-2" : "line-clamp-3";
  const tipPos =
    tooltipAlign === "left" ? "left-0" : "left-1/2 -translate-x-1/2";
  const { ref, isOverflowing } = useIsOverflowing<HTMLDivElement>([value, lines]);
  const showTip = Boolean(tipText) && isOverflowing;

  return (
    <div
      className={`group relative w-full ${showTip ? "cursor-default" : ""} ${className}`}
    >
      <div
        ref={ref}
        className={`${clamp} overflow-hidden break-words select-text`}
      >
        {value}
      </div>
      {showTip ? (
        <div role="tooltip" className={`${TOOLTIP_BOX} ${tipPos}`}>
          {tipText}
        </div>
      ) : null}
    </div>
  );
}

function CountryLabel({
  countryLine,
  flag,
}: {
  countryLine: string;
  flag: string | null;
}) {
  const { ref, isOverflowing } = useIsOverflowing<HTMLSpanElement>([countryLine]);
  const showTip = countryLine !== "—" && isOverflowing;

  return (
    <div
      className={`group relative flex h-full items-center justify-start gap-1 overflow-hidden ${showTip ? "cursor-default" : ""}`}
    >
      {flag ? (
        <span className="shrink-0 text-base leading-none sm:text-lg" aria-hidden>
          {flag}
        </span>
      ) : null}
      <span
        ref={ref}
        className="min-w-0 max-w-[min(100%,5.5rem)] truncate select-text text-left text-[10px] sm:text-[11px]"
      >
        {countryLine}
      </span>
      {showTip ? (
        <div role="tooltip" className={`${TOOLTIP_BOX} left-0`}>
          {countryLine}
        </div>
      ) : null}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function IconButton({
  title,
  onClick,
  disabled,
  children,
  className = "",
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function WineTable({
  wines,
  showActions = true,
  countryOptions = [],
  onDrink,
  onRestore,
  onUpdate,
  onDelete,
}: {
const COL_PCT_GUEST = [14, 14, 4, 10, 9, 9, 9, 10, 10.5, 10.5] as const;

/** 16 колонок без «Выпить»: дата … кол-во, гости, цена бут., цена бок. */
const COL_PCT_GUEST_SELECT = [
  4.5, 8.5, 10.5, 2.8, 7, 6, 5.5, 5, 6, 5.2, 5.2, 5.2, 3.2, 3.8, 7.5, 7.5,
] as const;

const inputClass =
  "h-7 w-full max-w-[4.5rem] rounded border border-zinc-200 bg-white px-1 text-center text-[10px] text-zinc-900 sm:h-8 sm:max-w-[5rem] sm:text-[11px]";

function scaleCols(cols: readonly number[]) {
  const sum = cols.reduce((a, b) => a + b, 0);
  return cols.map((w) => (w / sum) * 100);
}

type BaseProps = {
  wines: Wine[];
};

type CollectionProps = BaseProps & {
  variant?: "collection";
  showActions?: boolean;
  onToggleDrank?: (id: string, drank: boolean) => void | Promise<void>;
  guestSelection?: never;
};

type GuestProps = BaseProps & {
  variant: "guest";
  showActions?: never;
  onToggleDrank?: never;
  guestSelection?: never;
};

type GuestSelectProps = BaseProps & {
  variant: "guestSelect";
  guestSelection: {
    draft: GuestSelectionDraft;
    onDraftChange: (id: string, patch: Partial<GuestSelectionDraft[string]>) => void;
    invalidIds?: Set<string>;
  };
  showActions?: boolean;
  countryOptions?: string[];
  onDrink?: (wine: Wine) => void | Promise<void>;
  onRestore?: (wine: Wine) => void | Promise<void>;
  onUpdate?: (
    wine: Wine,
    patch: Record<string, unknown>,
  ) => void | Promise<void>;
  onDelete?: (wine: Wine) => void | Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  onToggleDrank?: (id: string, drank: boolean) => void | Promise<void>;
};

export type WineTableProps = CollectionProps | GuestProps | GuestSelectProps;

export function WineTable(props: WineTableProps) {
  const { wines, variant = "collection" } = props;
  const showActions =
    variant !== "guest" && (props.showActions ?? true) && props.onToggleDrank;
  const guestSelect = variant === "guestSelect" ? props.guestSelection : undefined;
  const invalidIds = guestSelect?.invalidIds;

  if (wines.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-zinc-500">
        Пусто
      </div>
    );
  }

  let colWidths: number[];
  if (variant === "guest") {
    colWidths = scaleCols(COL_PCT_GUEST);
  } else if (variant === "guestSelect") {
    colWidths = scaleCols(COL_PCT_GUEST_SELECT);
  } else {
    const cols = showActions ? [...COL_PCT_COLLECTION] : COL_PCT_COLLECTION.slice(0, -1);
    const scale = showActions
      ? 1
      : 100 / COL_PCT_COLLECTION.slice(0, -1).reduce((a, b) => a + b, 0);
    colWidths = cols.map((w) => (showActions ? w : w * scale));
  }

  const tableMinW =
    variant === "guestSelect" ? "min-w-[70rem]" : variant === "guest" ? "min-w-[52rem]" : "min-w-[56rem]";

  const rowCellClass = `${ROW_H} ${ROW_MAX} px-1 sm:px-1.5 py-0`;
  const hasRowActions = Boolean(onDrink || onRestore || onUpdate || onDelete);

  const handleDelete = async (wine: Wine) => {
    if (!onDelete) return;
    const label = wine.name?.trim() || "эту запись";
    if (!window.confirm(`Удалить «${label}» из базы? Это действие нельзя отменить.`)) {
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
    <div
      className={[
        "w-full min-w-0",
        variant === "guestSelect" ? "overflow-x-auto" : "max-md:overflow-x-auto md:overflow-x-visible",
      ].join(" ")}
    >
      <table
        className={`w-full ${tableMinW} table-fixed border-collapse text-[11px] leading-snug sm:text-[12px]`}
      >
    <div className="w-full min-w-0 max-md:overflow-x-auto md:overflow-visible">
      <table className="w-full min-w-[58rem] table-fixed border-collapse select-text text-[11px] leading-snug sm:min-w-0 sm:text-[12px]">
        <colgroup>
          {colWidths.map((w, i) => (
            <col key={i} style={{ width: `${w.toFixed(3)}%` }} />
          ))}
        </colgroup>
        <thead className="bg-zinc-50 text-center text-[10px] font-semibold text-zinc-600 sm:text-[11px]">
          <tr className="[&>th]:align-bottom [&>th]:px-1 [&>th]:py-1 sm:[&>th]:px-1.5 sm:[&>th]:py-1.5">
            {variant === "guest" ? (
              <>
                <th className="whitespace-normal">Название</th>
                <th className="whitespace-normal">Производитель</th>
                <th className="whitespace-nowrap">Год</th>
                <th className="whitespace-normal">Страна</th>
                <th className="whitespace-normal">Регион</th>
                <th className="whitespace-normal">Апелласьон</th>
                <th className="whitespace-normal">Сорт</th>
                <th className="whitespace-normal">Рейтинг</th>
                <th className="whitespace-nowrap">Бутылка</th>
                <th className="whitespace-nowrap">Бокал</th>
              </>
            ) : (
              <>
                <th className="whitespace-nowrap">Дата</th>
                <th className="whitespace-normal">Название</th>
                <th className="whitespace-normal">Производитель</th>
                <th className="whitespace-nowrap">Год</th>
                <th className="whitespace-normal">Страна</th>
                <th className="whitespace-normal">Регион</th>
                <th className="whitespace-normal">Апелласьон</th>
                <th className="whitespace-normal">Сорт</th>
                <th className="whitespace-normal">Рейтинг</th>
                <th className="whitespace-nowrap">Покупка</th>
                <th className="whitespace-nowrap">Израиль</th>
                <th className="whitespace-nowrap">Оригинал</th>
                <th className="whitespace-nowrap">Кол.</th>
                {guestSelect ? (
                  <>
                    <th className="whitespace-nowrap px-0.5">Гости</th>
                    <th className="whitespace-nowrap px-1">Бут.</th>
                    <th className="whitespace-nowrap px-1">Бок.</th>
                  </>
                ) : null}
                {showActions ? <th className="whitespace-nowrap"></th> : null}
              </>
            )}
            <th className="whitespace-nowrap">Дата</th>
            <th className="whitespace-normal">Название</th>
            <th className="whitespace-normal">Производитель</th>
            <th className="whitespace-nowrap pr-2 sm:pr-3">Год</th>
            <th className="whitespace-normal pl-2 sm:pl-3">Страна</th>
            <th className="whitespace-normal">Регион</th>
            <th className="whitespace-normal">Апелласьон</th>
            <th className="whitespace-normal">Сорт</th>
            <th className="whitespace-normal">Рейтинг</th>
            <th className="whitespace-nowrap">Покупка</th>
            <th className="whitespace-nowrap">Израиль</th>
            <th className="whitespace-nowrap">Оригинал</th>
            <th className="whitespace-normal">Количество</th>
            {showActions ? <th className="whitespace-nowrap"></th> : null}
          </tr>
        </thead>

        <tbody className="divide-y divide-zinc-100 text-zinc-800">
          {wines.map((w) => {
            const extra = displayNotes(w.notes);
            const ratingsText = displayRatings(w);
            const flag = countryCodeToFlagEmoji(w.countryCode);
            const countryLine = (w.country && w.country.trim()) || "—";
            const outOfStock = w.quantity <= 0;
            const draft = guestSelect?.draft[w.id];
            const rowInvalid = invalidIds?.has(w.id);

            const nameCell = (
              <td className={`${cellBase} font-medium text-zinc-900`}>
                <div className="flex flex-col items-center justify-start gap-0.5">
                  <div className="min-w-0 max-w-full break-words">{w.name || "—"}</div>
                  {extra ? (
                    <div className="max-w-full break-words text-[10px] font-normal leading-snug text-zinc-500 sm:text-[11px]">
                      {extra}
                    </div>
                  ) : null}
                </div>
              </td>
            );

            const countryCell = (
              <td className={`${cellBase} text-zinc-700`}>
                <div className="flex w-full max-w-full flex-nowrap items-center justify-center gap-1 overflow-hidden">
                  {flag ? (
                    <span
                      className="shrink-0 text-base leading-none sm:text-lg"
                      title={w.countryCode ?? undefined}
                      aria-hidden
                    >
                      {flag}
                    </span>
                  ) : null}
                  <span className="max-w-[min(100%,7rem)] truncate text-center text-[10px] sm:max-w-[min(100%,8.5rem)] sm:text-[11px]">
                    {countryLine}
                  </span>
                </div>
              </td>
            );

            if (variant === "guest") {
              return (
                <tr
                  key={w.id}
                  className="[&>td]:align-top [&>td]:px-1 [&>td]:py-1 sm:[&>td]:px-1.5 sm:[&>td]:py-1.5"
                >
                  {nameCell}
                  <td className={`${cellBase} text-zinc-700`}>{w.producer || "—"}</td>
                  <td className="text-center text-zinc-700">{w.year ?? "—"}</td>
                  {countryCell}
                  <td className={`${cellBase} text-zinc-700`}>{w.region || "—"}</td>
                  <td className={`${cellBase} text-zinc-600`}>{w.subregion || "—"}</td>
                  <td className={`${cellBase} text-zinc-600`}>{w.grape || "—"}</td>
                  <td className={cellBase}>{ratingsText || "—"}</td>
                  <td className="whitespace-nowrap text-center font-medium text-zinc-900">
                    {formatTableAmount(w.guestBottlePrice)}
                  </td>
                  <td className="whitespace-nowrap text-center text-zinc-800">
                    {formatTableAmount(w.guestGlassPrice)}
                  </td>
                </tr>
              );
            }

            return (
              <tr
                key={w.id}
                className={[
                  "[&>td]:align-top [&>td]:px-1 [&>td]:py-1 sm:[&>td]:px-1.5 sm:[&>td]:py-1.5",
                  outOfStock && guestSelect ? "bg-zinc-50/80 opacity-60" : "",
                  rowInvalid ? "bg-red-50/60" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <td className="whitespace-nowrap text-center text-zinc-600">
                  {formatDateRU(w.purchaseDate)}
                </td>
                {nameCell}
                <td className={`${cellBase} text-zinc-700`}>{w.producer || "—"}</td>
                <td className="text-center text-zinc-700">{w.year ?? "—"}</td>
                {countryCell}
                <td className={`${cellBase} text-zinc-700`}>{w.region || "—"}</td>
                <td className={`${cellBase} text-zinc-600`}>{w.subregion || "—"}</td>
                <td className={`${cellBase} text-zinc-600`}>{w.grape || "—"}</td>
                <td className={cellBase}>{ratingsText || "—"}</td>
                <td className="whitespace-nowrap text-center text-zinc-800">
                  {formatAmountWithCurrency(w.purchasePrice, w.purchaseCurrency)}
                </td>
                <td className="whitespace-nowrap text-center text-zinc-800">
                  {formatAmountWithCurrency(w.israelPrice, w.israelCurrency)}
                </td>
                <td className="whitespace-nowrap text-center text-zinc-800">
                  {formatAmountWithCurrency(w.originPrice, w.originCurrency)}
                </td>
                <td className="text-center font-medium text-zinc-900">{w.quantity}</td>

                {guestSelect ? (
                  outOfStock ? (
                    <>
                      <td colSpan={3} className="text-center text-[10px] text-zinc-500 sm:text-[11px]">
                        Нет в наличии
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="align-top px-0.5">
                        <div className="flex justify-center pt-0.5">
                          <input
                            type="checkbox"
                            checked={draft?.selected ?? false}
                            onChange={(e) =>
                              guestSelect.onDraftChange(w.id, { selected: e.target.checked })
                            }
                            className="size-3.5 rounded border-zinc-300 text-rose-700 focus:ring-rose-500 sm:size-4"
                            aria-label={`Включить ${w.name} в гостевую карту`}
                          />
                        </div>
                      </td>
                      <td className="align-top px-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={draft?.bottlePrice ?? ""}
                          onChange={(e) =>
                            guestSelect.onDraftChange(w.id, { bottlePrice: e.target.value })
                          }
                          disabled={!(draft?.selected ?? false)}
                          placeholder="—"
                          className={[
                            inputClass,
                            rowInvalid ? "border-red-400 bg-red-50" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-invalid={rowInvalid || undefined}
                        />
                        {rowInvalid ? (
                          <div className="mt-0.5 text-center text-[9px] text-red-600 sm:text-[10px]">
                            Укажите цену
                          </div>
                        ) : null}
                      </td>
                      <td className="align-top px-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={draft?.glassPrice ?? ""}
                          onChange={(e) =>
                            guestSelect.onDraftChange(w.id, { glassPrice: e.target.value })
                          }
                          disabled={!(draft?.selected ?? false)}
                          placeholder="—"
                          className={inputClass}
                        />
                      </td>
                    </>
                  )
                ) : null}

                {showActions && props.onToggleDrank ? (
                  <td className="align-top">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => void props.onToggleDrank!(w.id, !w.drank)}
                        className="inline-flex items-center justify-center rounded px-0.5 py-0.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 sm:px-1 sm:text-[11px]"
                      >
                        {w.drank ? "Вернуть" : "Выпить"}
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            const nameText = w.name?.trim() || "—";
            const nameTip =
              [nameText !== "—" ? nameText : null, extra].filter(Boolean).join("\n") ||
              undefined;
            const isEditing = editingId === w.id;
            const isBusy = savingId === w.id || deletingId === w.id;

            return (
              <Fragment key={w.id}>
                <tr className={ROW_H}>
                  <td className={`${cellCenter} ${rowCellClass} whitespace-nowrap text-zinc-600`}>
                    <div className="flex h-full items-center justify-center">
                      {formatDateRU(w.purchaseDate)}
                    </div>
                  </td>
                  <td className={`${cellBase} ${rowCellClass} text-left font-medium text-zinc-900`}>
                    <div className="flex h-full items-center justify-start">
                      <ClampedText
                        text={nameText}
                        lines={2}
                        className="w-full text-left"
                        tooltip={nameTip}
                        tooltipAlign="left"
                      />
                    </div>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} text-zinc-700`}>
                    <div className="flex h-full items-center justify-center">
                      <ClampedText text={w.producer} lines={2} />
                    </div>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} pr-2 text-zinc-700 sm:pr-3`}>
                    <div className="flex h-full items-center justify-center">
                      {formatWineYear(w.year)}
                    </div>
                  </td>
                  <td className={`${cellBase} ${rowCellClass} pl-2 text-left text-zinc-700 sm:pl-3`}>
                    <CountryLabel countryLine={countryLine} flag={flag} />
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} text-zinc-700`}>
                    <div className="flex h-full items-center justify-center">
                      <ClampedText text={w.region} lines={2} />
                    </div>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} text-zinc-600`}>
                    <div className="flex h-full items-center justify-center">
                      <ClampedText text={w.subregion} lines={3} />
                    </div>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} text-zinc-600`}>
                    <div className="flex h-full items-center justify-center">
                      <ClampedText text={w.grape} lines={3} />
                    </div>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass}`}>
                    <div className="flex h-full items-center justify-center">
                      <ClampedText text={ratingsText || undefined} lines={2} />
                    </div>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} whitespace-nowrap`}>
                    <div className="flex h-full items-center justify-center">
                      {formatAmountWithCurrency(w.purchasePrice, w.purchaseCurrency)}
                    </div>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} whitespace-nowrap`}>
                    <div className="flex h-full items-center justify-center">
                      {formatAmountWithCurrency(w.israelPrice, w.israelCurrency)}
                    </div>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} whitespace-nowrap`}>
                    <div className="flex h-full items-center justify-center">
                      {formatAmountWithCurrency(w.originPrice, w.originCurrency)}
                    </div>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} font-medium text-zinc-900`}>
                    <div className="flex h-full items-center justify-center">
                      {w.quantity}
                    </div>
                  </td>
                  {showActions && hasRowActions ? (
                    <td className={`${cellCenter} ${rowCellClass}`}>
                      <div className="flex h-full items-center justify-center gap-0.5">
                        {w.drank ? (
                          onRestore ? (
                            <button
                              type="button"
                              onClick={() => void onRestore(w)}
                              disabled={isBusy}
                              className="inline-flex items-center justify-center rounded px-0.5 py-0.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40 sm:px-1 sm:text-[11px]"
                            >
                              Вернуть
                            </button>
                          ) : null
                        ) : onDrink ? (
                          <button
                            type="button"
                            onClick={() => void onDrink(w)}
                            disabled={isBusy || isEditing}
                            className="inline-flex items-center justify-center rounded px-0.5 py-0.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40 sm:px-1 sm:text-[11px]"
                          >
                            Выпить
                          </button>
                        ) : null}
                        {onUpdate && !isEditing ? (
                          <IconButton
                            title="Редактировать"
                            disabled={isBusy}
                            onClick={() => setEditingId(w.id)}
                            className="text-zinc-500 hover:bg-zinc-100 hover:text-rose-700"
                          >
                            <PencilIcon />
                          </IconButton>
                        ) : null}
                        {onDelete ? (
                          <IconButton
                            title="Удалить"
                            disabled={isBusy}
                            onClick={() => void handleDelete(w)}
                            className="text-zinc-500 hover:bg-red-50 hover:text-red-700"
                          >
                            <TrashIcon />
                          </IconButton>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
                {isEditing && onUpdate ? (
                  <tr>
                    <td colSpan={cols.length} className="bg-zinc-50/80 px-2 py-2 sm:px-3">
                      <WineRowEditor
                        wine={w}
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
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
