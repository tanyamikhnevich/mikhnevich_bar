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

export function SortBar({ sortBy, sortDir, onSortBy, onSortDir, options }: Props) {
  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:mb-5 sm:px-4 sm:py-3">
      <p className="mb-2 text-xs font-medium text-zinc-500 sm:mb-0 sm:inline sm:mr-3">
        Сортировка
      </p>
      <div className="grid grid-cols-1 gap-2 sm:inline-grid sm:grid-cols-2 sm:gap-3">
        <select
          value={sortBy}
          onChange={(e) => onSortBy(e.target.value as WineSortKey)}
          className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 sm:h-9 sm:text-sm"
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
          className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 sm:h-9 sm:text-sm"
        >
          <option value="desc">по убыванию</option>
          <option value="asc">по возрастанию</option>
        </select>
      </div>
    </div>
  );
}
