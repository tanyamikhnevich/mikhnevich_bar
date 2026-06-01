"use client";

import { useState } from "react";
import type { Wine } from "@/lib/wines";
import {
  displayRatings,
  formatAmountWithCurrency,
  formatDateRU,
  formatWineYear,
} from "@/lib/wines";
import { formatDrankRating } from "@/lib/wineDrankRating";
import {
  drankDisplayFromExcel,
  type DrankExcelMetaEntry,
} from "@/lib/myWinesXlsxDrankMeta";
import { countryCodeToFlagEmoji } from "@/lib/wineUtils";
import { EditDrankMetaModal } from "./EditDrankMetaModal";
import { CountryTruncate, TruncateWithTooltip } from "./TruncateWithTooltip";
import {
  useWineRowMouseLeaveHandler,
  useWineTableMouseLeaveHandler,
  WineTableTooltipProvider,
} from "./WineTableTooltipContext";
import drankExcelMetaFile from "@/data/drank-excel-meta.json";

const EXCEL_META_BY_ROW = drankExcelMetaFile.byRow as Record<
  string,
  DrankExcelMetaEntry
>;

const ROW_H = "h-8";
const ROW_MAX = "max-h-8";
const cellBase = "min-w-0 select-text align-middle text-zinc-800";
const cellCenter = `${cellBase} text-center`;

/** Доли ширины (сумма 100%). */
const COL_PCT = [
  4.5, 14, 7.5, 2.5, 5.5, 5, 5.5, 5, 4, 5, 5, 5, 3.5, 6, 13,
] as const;

function TableCellWrap({
  children,
  align = "center",
}: {
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  const justify = align === "start" ? "justify-start" : "justify-center";
  return (
    <div className={`flex h-full w-full min-w-0 items-center ${justify}`}>
      {children}
    </div>
  );
}

function confirmRestore(wine: Wine): boolean {
  const label = wine.name?.trim() || "эту запись";
  return window.confirm(`Вы уверены, что хотите вернуть «${label}» в коллекцию?`);
}

function handleRestoreClick(
  wine: Wine,
  onRestore?: (wine: Wine) => void | Promise<void>,
) {
  if (!onRestore) return;
  if (!confirmRestore(wine)) return;
  void onRestore(wine);
}

export function DrankWineTable({
  wines,
  onRestore,
  onUpdate,
}: {
  wines: Wine[];
  onRestore?: (wine: Wine) => void | Promise<void>;
  onUpdate?: (
    wine: Wine,
    patch: { drankRating: number | null; drankNotes: string | null },
  ) => void | Promise<void>;
}) {
  const [editTarget, setEditTarget] = useState<{
    wine: Wine;
    rating: number | null;
    notes: string | null;
  } | null>(null);

  if (wines.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-zinc-500">Пусто</div>
    );
  }

  const onTableLeave = useWineTableMouseLeaveHandler();
  const rowCellClass = `${ROW_H} ${ROW_MAX} px-0.5 sm:px-1 py-0`;

  const openEdit = (wine: Wine) => {
    const display = drankDisplayFromExcel(wine, EXCEL_META_BY_ROW);
    setEditTarget({
      wine,
      rating: display.rating,
      notes: display.notes,
    });
  };

  return (
    <>
      <div className="divide-y divide-zinc-100 md:hidden">
        {wines.map((wine) => (
          <DrankWineMobileRow
            key={wine.id}
            wine={wine}
            onRestore={onRestore}
            onEdit={onUpdate ? () => openEdit(wine) : undefined}
          />
        ))}
      </div>
      <div className="hidden w-full min-w-0 md:block md:overflow-visible">
        <WineTableTooltipProvider>
          <table
            onMouseLeave={onTableLeave}
            className="w-full table-fixed border-collapse select-text text-[11px] leading-snug sm:text-[12px]"
          >
            <colgroup>
              {COL_PCT.map((w, i) => (
                <col key={i} style={{ width: `${w}%` }} />
              ))}
            </colgroup>
            <thead className="bg-zinc-50 text-center text-[10px] font-semibold text-zinc-600 sm:text-[11px]">
              <tr className="[&>th]:align-bottom [&>th]:px-0.5 [&>th]:py-0.5 sm:[&>th]:px-1 sm:[&>th]:py-1">
                <th className="whitespace-nowrap">Когда</th>
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
                <th className="whitespace-normal">Оценка</th>
                <th className="whitespace-normal">Заметки</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {wines.map((wine) => (
                <DrankWineDesktopRow
                  key={wine.id}
                  wine={wine}
                  rowCellClass={rowCellClass}
                  onRestore={onRestore}
                  onEdit={onUpdate ? () => openEdit(wine) : undefined}
                />
              ))}
            </tbody>
          </table>
        </WineTableTooltipProvider>
      </div>

      <EditDrankMetaModal
        wine={editTarget?.wine ?? null}
        initialRating={editTarget?.rating ?? null}
        initialNotes={editTarget?.notes ?? null}
        onClose={() => setEditTarget(null)}
        onSave={async (input) => {
          if (!editTarget || !onUpdate) return;
          await onUpdate(editTarget.wine, input);
        }}
      />
    </>
  );
}

function DrankWineDesktopRow({
  wine,
  rowCellClass,
  onRestore,
  onEdit,
}: {
  wine: Wine;
  rowCellClass: string;
  onRestore?: (wine: Wine) => void | Promise<void>;
  onEdit?: () => void;
}) {
  const onRowLeave = useWineRowMouseLeaveHandler();
  const flag = countryCodeToFlagEmoji(wine.countryCode);
  const display = drankDisplayFromExcel(wine, EXCEL_META_BY_ROW);
  const ratingsText = displayRatings(wine);

  return (
    <tr className={`${ROW_H} group hover:bg-zinc-50/80`} onMouseLeave={onRowLeave}>
      <td className={`${cellCenter} ${rowCellClass} whitespace-nowrap text-zinc-600`}>
        <TableCellWrap>
          {wine.drankAt ? formatDateRU(wine.drankAt.slice(0, 10)) : "—"}
        </TableCellWrap>
      </td>
      <td className={`${cellBase} ${rowCellClass} text-left font-medium text-zinc-900`}>
        <TableCellWrap align="start">
          <TruncateWithTooltip text={wine.name?.trim() || "—"} />
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass} text-zinc-700`}>
        <TableCellWrap align="start">
          <TruncateWithTooltip text={wine.producer || "—"} />
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass} text-zinc-700`}>
        <TableCellWrap>
          <span className="truncate">{formatWineYear(wine.year)}</span>
        </TableCellWrap>
      </td>
      <td className={`${cellBase} ${rowCellClass} pl-1 text-left text-zinc-700`}>
        <CountryTruncate
          countryLine={(wine.country && wine.country.trim()) || "—"}
          flag={flag}
          align="start"
        />
      </td>
      <td className={`${cellCenter} ${rowCellClass} text-zinc-700`}>
        <TableCellWrap align="start">
          <TruncateWithTooltip text={wine.region || "—"} />
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass} text-zinc-700`}>
        <TableCellWrap align="start">
          <TruncateWithTooltip text={wine.subregion || "—"} />
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass} text-zinc-700`}>
        <TableCellWrap align="start">
          <TruncateWithTooltip text={wine.grape || "—"} />
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass}`}>
        <TableCellWrap>
          <TruncateWithTooltip text={ratingsText || "—"} />
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass} whitespace-nowrap`}>
        <TableCellWrap>
          {formatAmountWithCurrency(wine.purchasePrice, wine.purchaseCurrency)}
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass} whitespace-nowrap`}>
        <TableCellWrap>
          {formatAmountWithCurrency(wine.israelPrice, wine.israelCurrency)}
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass} whitespace-nowrap`}>
        <TableCellWrap>
          {formatAmountWithCurrency(wine.originPrice, wine.originCurrency)}
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass}`}>
        <TableCellWrap>
          {display.rating != null ? formatDrankRating(display.rating) : "—"}
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass}`}>
        <TableCellWrap align="start">
          <TruncateWithTooltip text={display.notes || "—"} />
        </TableCellWrap>
      </td>
      <td className={`${cellCenter} ${rowCellClass}`}>
        <div className="flex flex-wrap items-center justify-center gap-0.5">
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="whitespace-nowrap rounded px-0.5 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 sm:px-1 sm:text-[11px]"
            >
              Изменить
            </button>
          ) : null}
          {onRestore ? (
            <button
              type="button"
              onClick={() => handleRestoreClick(wine, onRestore)}
              className="whitespace-nowrap rounded px-0.5 py-0.5 text-[10px] font-medium text-emerald-800 hover:bg-emerald-50 sm:px-1 sm:text-[11px]"
            >
              Вернуть
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function DrankWineMobileRow({
  wine,
  onRestore,
  onEdit,
}: {
  wine: Wine;
  onRestore?: (wine: Wine) => void | Promise<void>;
  onEdit?: () => void;
}) {
  const display = drankDisplayFromExcel(wine, EXCEL_META_BY_ROW);
  const ratingsText = displayRatings(wine);

  return (
    <article className="px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-zinc-900">{wine.name}</p>
          <p className="text-xs text-zinc-500">
            {wine.producer}
            {wine.year?.trim() ? ` · ${formatWineYear(wine.year)}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-800"
            >
              Изменить
            </button>
          ) : null}
          {onRestore ? (
            <button
              type="button"
              onClick={() => handleRestoreClick(wine, onRestore)}
              className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-800"
            >
              Вернуть
            </button>
          ) : null}
        </div>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600">
        <div>
          <dt className="text-zinc-400">Когда</dt>
          <dd>
            {wine.drankAt ? formatDateRU(wine.drankAt.slice(0, 10)) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-400">Моя оценка</dt>
          <dd>
            {display.rating != null ? formatDrankRating(display.rating) : "—"}
          </dd>
        </div>
        {wine.region ? (
          <div>
            <dt className="text-zinc-400">Регион</dt>
            <dd>{wine.region}</dd>
          </div>
        ) : null}
        {ratingsText ? (
          <div>
            <dt className="text-zinc-400">Рейтинг</dt>
            <dd>{ratingsText}</dd>
          </div>
        ) : null}
        {display.notes ? (
          <div className="col-span-2">
            <dt className="text-zinc-400">Заметки</dt>
            <dd className="text-zinc-700">{display.notes}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
