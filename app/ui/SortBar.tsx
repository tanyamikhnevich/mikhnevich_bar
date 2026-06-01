"use client";

import type { WineSortKey } from "@/lib/wines";

type Option = { value: WineSortKey; label: string };

type Props = {
  sortBy: WineSortKey;
  sortDir: "asc" | "desc";
  onSortBy: (v: WineSortKey) => void;
  onSortDir: (v: "asc" | "desc") => void;
  options: Option[];
};

const selectClass =
  "h-7 max-w-[9.5rem] min-w-0 rounded border border-zinc-200 bg-white px-1.5 text-xs text-zinc-900";

export function SortBar({ sortBy, sortDir, onSortBy, onSortDir, options }: Props) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-zinc-600">
      <span className="shrink-0 text-zinc-500">Сорт.</span>
      <select
        value={sortBy}
        onChange={(e) => onSortBy(e.target.value as WineSortKey)}
        className={selectClass}
        aria-label="Поле сортировки"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={sortDir}
        onChange={(e) => onSortDir(e.target.value as "asc" | "desc")}
        className={`${selectClass} max-w-[7.5rem]`}
        aria-label="Направление сортировки"
      >
        <option value="desc">↓ убыв.</option>
        <option value="asc">↑ возр.</option>
      </select>
    </div>
  );
}
