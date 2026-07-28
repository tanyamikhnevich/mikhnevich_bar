"use client";

import { Fragment, useState, type ReactNode } from "react";
import type { Wine } from "@/lib/wines";
import {
  displayNotes,
  displayRatings,
  formatAmountWithCurrency,
  formatDateRU,
  formatWineYear,
} from "@/lib/wines";
import { countryCodeToFlagEmoji } from "@/lib/wineUtils";
import { CountryTruncate, TruncateWithTooltip } from "./TruncateWithTooltip";
import { WineRowEditor } from "./WineRowEditor";
import { WineMobileList } from "./WineMobileList";
import { formatDrankRating } from "@/lib/wineDrankRating";
import {
  drankDisplayFromExcel,
  type DrankExcelMetaEntry,
} from "@/lib/myWinesXlsxDrankMeta";
import drankExcelMetaFile from "@/data/drank-excel-meta.json";
import {
  useWineRowMouseLeaveHandler,
  useWineTableMouseLeaveHandler,
  WineTableTooltipProvider,
} from "./WineTableTooltipContext";

const EXCEL_META_BY_ROW = drankExcelMetaFile.byRow as Record<
  string,
  DrankExcelMetaEntry
>;

function TableCellWrap({
  children,
  align = "center",
}: {
  children: ReactNode;
  align?: "center" | "start";
}) {
  const justify =
    align === "start" ? "justify-start" : "justify-center";
  return (
    <div className={`flex h-full w-full min-w-0 items-center ${justify}`}>
      {children}
    </div>
  );
}

const ROW_H = "h-8";
const ROW_MAX = "max-h-8";

const cellBase = "min-w-0 select-text align-middle text-zinc-800";
const cellCenter = `${cellBase} text-center`;

/** Доли ширины (сумма 100%). */
const COL_PCT = [
  5.5, 15.5, 9.5, 2.5, 6.5, 6.5, 8, 7.5, 5, 6.5, 6, 6, 3, 14,
] as const;

const COL_PCT_Drank = [
  4.5, 14, 7.5, 2.5, 5.5, 5, 5.5, 5, 4, 5, 5, 5, 3.5, 6, 13,
] as const;

type WineTableVariant = "collection" | "drank";

function confirmRestore(wine: Wine): boolean {
  const label = wine.name?.trim() || "эту запись";
  return window.confirm(
    `Вы уверены, что хотите вернуть «${label}» в коллекцию?`,
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

function CopyIcon() {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
  children: ReactNode;
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
  variant = "collection",
  showActions = true,
  countryOptions = [],
  onDrink,
  onRestore,
  onUpdate,
  onDelete,
  onCopy,
}: {
  wines: Wine[];
  variant?: WineTableVariant;
  showActions?: boolean;
  countryOptions?: string[];
  onDrink?: (wine: Wine) => void | Promise<void>;
  onRestore?: (wine: Wine) => void | Promise<void>;
  onUpdate?: (
    wine: Wine,
    patch: Record<string, unknown>,
  ) => void | Promise<void>;
  onDelete?: (wine: Wine) => void | Promise<void>;
  onCopy?: (wine: Wine) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (wines.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-zinc-500">
        Пусто
      </div>
    );
  }

  const baseCols = variant === "drank" ? COL_PCT_Drank : COL_PCT;
  const cols = showActions ? [...baseCols] : baseCols.slice(0, -1);
  const scale = showActions
    ? 1
    : 100 / baseCols.slice(0, -1).reduce((a, b) => a + b, 0);

  const rowCellClass = `${ROW_H} ${ROW_MAX} px-0.5 sm:px-1 py-0`;
  const hasRowActions = Boolean(onDrink || onRestore || onUpdate || onDelete || onCopy);

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

  const handleRestore = async (wine: Wine) => {
    if (!onRestore) return;
    if (!confirmRestore(wine)) return;
    await onRestore(wine);
  };

  return (
    <>
      <WineMobileList
        variant={variant}
        wines={wines}
        countryOptions={countryOptions}
        onDrink={onDrink}
        onRestore={onRestore ? handleRestore : undefined}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
      <div className="hidden w-full min-w-0 md:block md:overflow-visible">
      <WineTableTooltipProvider>
      <WineTableDesktop
        variant={variant}
        cols={cols}
        showActions={showActions}
        scale={scale}
        wines={wines}
        countryOptions={countryOptions}
        onDrink={onDrink}
        onRestore={onRestore ? handleRestore : undefined}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onCopy={onCopy}
        editingId={editingId}
        setEditingId={setEditingId}
        savingId={savingId}
        setSavingId={setSavingId}
        deletingId={deletingId}
        handleDelete={handleDelete}
        hasRowActions={hasRowActions}
        rowCellClass={rowCellClass}
      />
      </WineTableTooltipProvider>
    </div>
    </>
  );
}

function WineTableDesktop({
  variant,
  cols,
  showActions,
  scale,
  wines,
  countryOptions,
  onDrink,
  onRestore,
  onUpdate,
  onDelete,
  onCopy,
  editingId,
  setEditingId,
  savingId,
  setSavingId,
  deletingId,
  handleDelete,
  hasRowActions,
  rowCellClass,
}: {
  variant: WineTableVariant;
  cols: number[];
  showActions: boolean;
  scale: number;
  wines: Wine[];
  countryOptions: string[];
  onDrink?: (wine: Wine) => void | Promise<void>;
  onRestore?: (wine: Wine) => void | Promise<void>;
  onUpdate?: (wine: Wine, patch: Record<string, unknown>) => void | Promise<void>;
  onDelete?: (wine: Wine) => void | Promise<void>;
  onCopy?: (wine: Wine) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  savingId: string | null;
  setSavingId: (id: string | null) => void;
  deletingId: string | null;
  handleDelete: (wine: Wine) => Promise<void>;
  hasRowActions: boolean;
  rowCellClass: string;
}) {
  const onTableLeave = useWineTableMouseLeaveHandler();

  return (
      <table
        onMouseLeave={onTableLeave}
        className="w-full table-fixed border-collapse select-text text-[11px] leading-snug sm:text-[12px]"
      >
        <colgroup>
          {cols.map((w, i) => (
            <col
              key={i}
              style={{ width: `${(showActions ? w : w * scale).toFixed(3)}%` }}
            />
          ))}
        </colgroup>
        <thead className="bg-zinc-50 text-center text-[10px] font-semibold text-zinc-600 sm:text-[11px]">
          <tr className="[&>th]:align-bottom [&>th]:px-0.5 [&>th]:py-0.5 sm:[&>th]:px-1 sm:[&>th]:py-1">
            <th className="whitespace-nowrap">
              {variant === "drank" ? "Когда" : "Дата"}
            </th>
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
            {variant === "drank" ? (
              <>
                <th className="whitespace-normal">Оценка</th>
                <th className="whitespace-normal">Заметки</th>
              </>
            ) : (
              <th className="whitespace-normal">Количество</th>
            )}
            {showActions ? <th className="whitespace-nowrap"></th> : null}
          </tr>
        </thead>

        <WineTableTbody
          variant={variant}
          wines={wines}
          cols={cols}
          showActions={showActions}
          hasRowActions={hasRowActions}
          rowCellClass={rowCellClass}
          countryOptions={countryOptions}
          onDrink={onDrink}
          onRestore={onRestore}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onCopy={onCopy}
          editingId={editingId}
          setEditingId={setEditingId}
          savingId={savingId}
          setSavingId={setSavingId}
          deletingId={deletingId}
          handleDelete={handleDelete}
        />
      </table>
  );
}

function WineTableTbody({
  variant,
  wines,
  cols,
  showActions,
  hasRowActions,
  rowCellClass,
  countryOptions,
  onDrink,
  onRestore,
  onUpdate,
  onDelete,
  onCopy,
  editingId,
  setEditingId,
  savingId,
  setSavingId,
  deletingId,
  handleDelete,
}: {
  variant: WineTableVariant;
  wines: Wine[];
  cols: number[];
  showActions: boolean;
  hasRowActions: boolean;
  rowCellClass: string;
  countryOptions: string[];
  onDrink?: (wine: Wine) => void | Promise<void>;
  onRestore?: (wine: Wine) => void | Promise<void>;
  onUpdate?: (wine: Wine, patch: Record<string, unknown>) => void | Promise<void>;
  onDelete?: (wine: Wine) => void | Promise<void>;
  onCopy?: (wine: Wine) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  savingId: string | null;
  setSavingId: (id: string | null) => void;
  deletingId: string | null;
  handleDelete: (wine: Wine) => Promise<void>;
}) {
  const onRowLeave = useWineRowMouseLeaveHandler();

  return (
        <tbody className="divide-y divide-zinc-100 text-zinc-800">
          {wines.map((w) => {
            const extra = displayNotes(w.notes);
            const ratingsText = displayRatings(w);
            const drankDisplay =
              variant === "drank"
                ? drankDisplayFromExcel(w, EXCEL_META_BY_ROW)
                : null;
            const flag = countryCodeToFlagEmoji(w.countryCode);
            const countryLine = (w.country && w.country.trim()) || "—";
            const nameText = w.name?.trim() || "—";
            const nameTip =
              [nameText !== "—" ? nameText : null, extra].filter(Boolean).join("\n") ||
              undefined;
            const isEditing = editingId === w.id;
            const isBusy = savingId === w.id || deletingId === w.id;
            const dateLabel =
              variant === "drank"
                ? w.drankAt
                  ? formatDateRU(w.drankAt.slice(0, 10))
                  : "—"
                : formatDateRU(w.purchaseDate);

            return (
              <Fragment key={w.id}>
                <tr className={ROW_H} onMouseLeave={onRowLeave}>
                  <td className={`${cellCenter} ${rowCellClass} whitespace-nowrap text-zinc-600`}>
                    <div className="flex h-full items-center justify-center">
                      {dateLabel}
                    </div>
                  </td>
                  <td className={`${cellBase} ${rowCellClass} text-left font-medium text-zinc-900`}>
                    <TableCellWrap align="start">
                      <TruncateWithTooltip
                        text={nameText}
                        className="w-full text-left"
                        tooltip={nameTip}
                        tooltipAlign="left"
                      />
                    </TableCellWrap>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} text-zinc-700`}>
                    <TableCellWrap>
                      <TruncateWithTooltip text={w.producer} />
                    </TableCellWrap>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} pr-2 text-zinc-700 sm:pr-3`}>
                    <div className="flex h-full items-center justify-center">
                      {formatWineYear(w.year)}
                    </div>
                  </td>
                  <td className={`${cellBase} ${rowCellClass} pl-2 text-left text-zinc-700 sm:pl-3`}>
                    <CountryTruncate countryLine={countryLine} flag={flag} align="start" />
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} text-zinc-700`}>
                    <TableCellWrap>
                      <TruncateWithTooltip text={w.region} />
                    </TableCellWrap>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} text-zinc-600`}>
                    <TableCellWrap>
                      <TruncateWithTooltip text={w.subregion} />
                    </TableCellWrap>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass} text-zinc-600`}>
                    <TableCellWrap>
                      <TruncateWithTooltip text={w.grape} />
                    </TableCellWrap>
                  </td>
                  <td className={`${cellCenter} ${rowCellClass}`}>
                    <TableCellWrap>
                      <TruncateWithTooltip text={ratingsText || undefined} />
                    </TableCellWrap>
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
                  {variant === "drank" ? (
                    <>
                      <td className={`${cellCenter} ${rowCellClass}`}>
                        <TableCellWrap>
                          {drankDisplay?.rating != null
                            ? formatDrankRating(drankDisplay.rating)
                            : "—"}
                        </TableCellWrap>
                      </td>
                      <td className={`${cellCenter} ${rowCellClass}`}>
                        <TableCellWrap align="start">
                          <TruncateWithTooltip
                            text={drankDisplay?.notes || "—"}
                          />
                        </TableCellWrap>
                      </td>
                    </>
                  ) : (
                    <td className={`${cellCenter} ${rowCellClass} font-medium text-zinc-900`}>
                      <div className="flex h-full items-center justify-center">
                        {w.quantity}
                      </div>
                    </td>
                  )}
                  {showActions && hasRowActions ? (
                    <td className={`${cellCenter} ${rowCellClass}`}>
                      <div className="flex h-full items-center justify-center gap-0.5">
                        {variant === "drank" || w.drank ? (
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
                        {onCopy ? (
                          <IconButton
                            title="Скопировать как новое вино в коллекцию"
                            disabled={isBusy}
                            onClick={() => onCopy(w)}
                            className="text-zinc-500 hover:bg-zinc-100 hover:text-rose-700"
                          >
                            <CopyIcon />
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
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
  );
}
