"use client";

import type { WineSortKey } from "@/lib/wines";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Props = {
  sortBy: WineSortKey;
  sortDir: "asc" | "desc";
  onSortBy: (v: WineSortKey) => void;
  onSortDir: (v: "asc" | "desc") => void;
  options: WineSortKey[];
};

const selectClass =
  "h-7 max-w-[9.5rem] min-w-0 rounded border border-zinc-200 bg-white px-1.5 text-xs text-zinc-900";

export function SortBar({ sortBy, sortDir, onSortBy, onSortDir, options }: Props) {
  const { t } = useI18n();
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-zinc-600">
      <span className="shrink-0 text-zinc-500">{t.sort.label}</span>
      <select
        value={sortBy}
        onChange={(e) => onSortBy(e.target.value as WineSortKey)}
        className={selectClass}
        aria-label={t.sort.fieldAria}
      >
        {options.map((key) => (
          <option key={key} value={key}>
            {t.sort.keys[key]}
          </option>
        ))}
      </select>
      <select
        value={sortDir}
        onChange={(e) => onSortDir(e.target.value as "asc" | "desc")}
        className={`${selectClass} max-w-[7.5rem]`}
        aria-label={t.sort.dirAria}
      >
        <option value="desc">{t.sort.desc}</option>
        <option value="asc">{t.sort.asc}</option>
      </select>
    </div>
  );
}
