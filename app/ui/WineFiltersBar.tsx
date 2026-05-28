"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { WinePriceFilterField } from "@/lib/wineQuery";

const SEARCH_DEBOUNCE_MS = 320;

type Props = {
  nameQuery: string;
  onNameQuery: (v: string) => void;
  countryKeys: string[];
  onCountryKeys: (v: string[]) => void;
  countryOptions: string[];
  regionKey: string;
  onRegionKey: (v: string) => void;
  regionOptions: string[];
  priceField: WinePriceFilterField;
  onPriceField: (v: WinePriceFilterField) => void;
  priceMin: string;
  onPriceMin: (v: string) => void;
  priceMax: string;
  onPriceMax: (v: string) => void;
  ratingMin: string;
  onRatingMin: (v: string) => void;
  onReset: () => void;
};

const PRICE_LABEL: Record<WinePriceFilterField, string> = {
  purchase: "покупка",
  israel: "Израиль",
  origin: "оригинал",
  guestBottle: "бутылка (гость)",
  guestGlass: "бокал (гость)",
};

function CountryMultiSelect({
  selected,
  options,
  onChange,
}: {
  selected: string[];
  options: string[];
  onChange: (keys: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const label =
    selected.length === 0
      ? "Все страны"
      : selected.length === 1
        ? selected[0]
        : selected.length <= 2
          ? selected.join(", ")
          : `${selected.length} стран`;

  const toggle = (country: string) => {
    if (selected.includes(country)) {
      onChange(selected.filter((c) => c !== country));
    } else {
      onChange(
        [...selected, country].sort((a, b) => a.localeCompare(b, "ru")),
      );
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-1 rounded-lg border border-zinc-200 bg-white px-3 text-left text-base text-zinc-900 sm:h-9 sm:rounded-md sm:px-2 sm:text-sm"
      >
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-zinc-400" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={listId}
          className="absolute left-0 right-0 z-30 mt-1 max-h-52 overflow-y-auto overscroll-contain rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {options.length === 0 ? (
            <p className="px-2 py-2 text-xs text-zinc-500">Нет стран в коллекции</p>
          ) : (
            options.map((country) => {
              const checked = selected.includes(country);
              return (
                <label
                  key={country}
                  className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(country)}
                    className="size-3.5 shrink-0 rounded border-zinc-300 text-rose-700 focus:ring-rose-200"
                  />
                  <span className="min-w-0 truncate text-xs sm:text-sm">{country}</span>
                </label>
              );
            })
          )}
          {selected.length > 0 ? (
            <div className="border-t border-zinc-100 px-2 py-1.5">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-rose-700 hover:underline"
              >
                Сбросить страны
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function WineFiltersBar({
  nameQuery,
  onNameQuery,
  countryKeys,
  onCountryKeys,
  countryOptions,
  regionKey,
  onRegionKey,
  regionOptions,
  priceField,
  onPriceField,
  priceMin,
  onPriceMin,
  priceMax,
  onPriceMax,
  ratingMin,
  onRatingMin,
  onReset,
}: Props) {
  const [searchDraft, setSearchDraft] = useState(nameQuery);

  useEffect(() => {
    setSearchDraft(nameQuery);
  }, [nameQuery]);

  useEffect(() => {
    if (searchDraft === nameQuery) return;
    const id = window.setTimeout(() => {
      onNameQuery(searchDraft);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchDraft, nameQuery, onNameQuery]);

  const regionDisabled = countryKeys.length !== 1;

  const activeCount = [
    nameQuery.trim(),
    countryKeys.length > 0,
    regionKey,
    priceMin.trim(),
    priceMax.trim(),
    ratingMin.trim(),
  ].filter(Boolean).length;

  const [expanded, setExpanded] = useState(false);
  const showPanel = expanded || activeCount > 0;

  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white shadow-sm sm:mb-5">
      <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-h-10 min-w-0 flex-1 items-center gap-2 text-left sm:pointer-events-none"
          aria-expanded={showPanel}
        >
          <span className="font-medium text-zinc-800 sm:text-sm">Фильтры</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
              {activeCount}
            </span>
          ) : null}
          <span className="ml-auto text-zinc-400 sm:hidden" aria-hidden>
            {showPanel ? "▴" : "▾"}
          </span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 text-sm font-medium text-rose-700 active:text-rose-900 sm:text-sm"
        >
          Сбросить
        </button>
      </div>

      <label className="flex min-w-0 flex-col gap-1 border-t border-zinc-100 px-3 py-3 sm:hidden">
        <span className="text-xs font-medium text-zinc-600">Поиск</span>
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Название или производитель…"
          className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900"
        />
      </label>

      <div
        className={[
          "space-y-3 border-t border-zinc-100 px-3 pb-3 text-xs sm:px-4 sm:pb-4 sm:text-sm",
          showPanel ? "block" : "hidden sm:block",
        ].join(" ")}
      >
      <label className="hidden min-w-0 flex-col gap-1 sm:flex lg:col-span-3">
        <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">
          Название или производитель
        </span>
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Поиск по названию или производителю…"
          className="h-8 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 sm:h-9 sm:text-sm"
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-x-2 lg:gap-y-2">
        <div className="flex min-w-0 flex-col gap-1 lg:col-span-2">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Страна</span>
          <CountryMultiSelect
            selected={countryKeys}
            options={countryOptions}
            onChange={onCountryKeys}
          />
        </div>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-2">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Регион</span>
          <select
            value={regionKey}
            onChange={(e) => onRegionKey(e.target.value)}
            disabled={regionDisabled}
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 sm:h-9 sm:rounded-md sm:px-2 sm:text-sm"
          >
            <option value="">
              {regionDisabled
                ? countryKeys.length === 0
                  ? "Сначала страна"
                  : "Одна страна"
                : "Все"}
            </option>
            {regionOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-2">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Цена (поле)</span>
          <select
            value={priceField}
            onChange={(e) => onPriceField(e.target.value as WinePriceFilterField)}
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 sm:h-9 sm:rounded-md sm:px-2 sm:text-sm"
          >
            {(Object.keys(PRICE_LABEL) as WinePriceFilterField[]).map((k) => (
              <option key={k} value={k}>
                {PRICE_LABEL[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-1">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Цена от</span>
          <input
            type="text"
            inputMode="decimal"
            value={priceMin}
            onChange={(e) => onPriceMin(e.target.value)}
            placeholder="—"
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 sm:h-9 sm:rounded-md sm:px-2 sm:text-sm"
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-1">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Цена до</span>
          <input
            type="text"
            inputMode="decimal"
            value={priceMax}
            onChange={(e) => onPriceMax(e.target.value)}
            placeholder="—"
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 sm:h-9 sm:rounded-md sm:px-2 sm:text-sm"
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-1">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Vivino ≥</span>
          <input
            type="text"
            inputMode="decimal"
            value={ratingMin}
            onChange={(e) => onRatingMin(e.target.value)}
            placeholder="—"
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-base text-zinc-900 sm:h-9 sm:rounded-md sm:px-2 sm:text-sm"
          />
        </label>
      </div>
      </div>
    </div>
  );
}
