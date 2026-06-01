"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  priceFieldOptionsFor,
  ratingFilterLabelFor,
  type WineFilterContext,
} from "@/lib/wineListUi";
import type { WinePriceFilterField } from "@/lib/wineQuery";

const SEARCH_DEBOUNCE_MS = 320;

function countryKeysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

type Props = {
  filterContext?: WineFilterContext;
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

function CountryMultiSelect({
  selected,
  options,
  onChange,
  onOpenChange,
  onPanelClose,
}: {
  selected: string[];
  options: string[];
  onChange: (keys: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onPanelClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const wasOpenRef = useRef(false);

  const closePanel = () => setOpen(false);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (wasOpenRef.current && !open) onPanelClose?.();
    wasOpenRef.current = open;
  }, [open, onPanelClose]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      closePanel();
    };
    document.addEventListener("click", onDoc, true);
    return () => document.removeEventListener("click", onDoc, true);
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
        onClick={() => (open ? closePanel() : setOpen(true))}
        className="flex h-7 w-full items-center justify-between gap-1 rounded border border-zinc-200 bg-white px-2 text-left text-xs text-zinc-900"
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
          onClick={(e) => e.stopPropagation()}
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
  filterContext = "collection",
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
  const priceOptions = priceFieldOptionsFor(filterContext);
  const ratingLabel = ratingFilterLabelFor(filterContext);
  const [searchDraft, setSearchDraft] = useState(nameQuery);
  const [countryDraft, setCountryDraft] = useState(countryKeys);
  const countryDraftRef = useRef(countryKeys);
  const committedCountryKeysRef = useRef(countryKeys);
  const onCountryKeysRef = useRef(onCountryKeys);
  const countryPanelOpenRef = useRef(false);

  committedCountryKeysRef.current = countryKeys;
  onCountryKeysRef.current = onCountryKeys;

  useEffect(() => {
    setSearchDraft(nameQuery);
  }, [nameQuery]);

  useEffect(() => {
    countryDraftRef.current = countryDraft;
  }, [countryDraft]);

  useEffect(() => {
    if (countryPanelOpenRef.current) return;
    setCountryDraft(countryKeys);
    countryDraftRef.current = countryKeys;
  }, [countryKeys]);

  useEffect(() => {
    if (searchDraft === nameQuery) return;
    const id = window.setTimeout(() => {
      onNameQuery(searchDraft);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchDraft, nameQuery, onNameQuery]);

  const flushCountryDraft = useCallback(() => {
    const next = countryDraftRef.current;
    if (!countryKeysEqual(next, committedCountryKeysRef.current)) {
      onCountryKeysRef.current(next);
    }
  }, []);

  const flushCountryDraftRef = useRef(flushCountryDraft);
  flushCountryDraftRef.current = flushCountryDraft;

  const handleCountryDraftChange = useCallback((keys: string[]) => {
    countryDraftRef.current = keys;
    setCountryDraft(keys);
  }, []);

  const handleCountryPanelOpenChange = useCallback((open: boolean) => {
    countryPanelOpenRef.current = open;
  }, []);

  const handleCountryPanelClose = useCallback(() => {
    flushCountryDraftRef.current();
  }, []);

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

  const compactInput =
    "h-7 w-full min-w-0 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-900";

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex h-7 items-center gap-1 rounded border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
          aria-expanded={expanded}
        >
          Фильтры
          {activeCount > 0 ? (
            <span className="rounded-full bg-rose-100 px-1.5 text-[10px] font-semibold leading-4 text-rose-800">
              {activeCount}
            </span>
          ) : null}
          <span className="text-zinc-400" aria-hidden>
            {expanded ? "▴" : "▾"}
          </span>
        </button>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onReset}
            className="h-7 px-1.5 text-xs font-medium text-rose-700 hover:text-rose-900"
          >
            Сбросить
          </button>
        ) : null}
      </div>

      <div
        className={[
          "mt-1.5 space-y-2 rounded-lg border border-zinc-200 bg-white p-2 text-xs shadow-sm",
          expanded ? "block" : "hidden",
        ].join(" ")}
      >
      <label className="flex min-w-0 flex-col gap-1 lg:col-span-3">
        <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">
          Название или производитель
        </span>
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Поиск по названию или производителю…"
          className={compactInput}
        />
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-x-2 lg:gap-y-1.5">
        <div className="flex min-w-0 flex-col gap-1 lg:col-span-2">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Страна</span>
          <CountryMultiSelect
            selected={countryDraft}
            options={countryOptions}
            onChange={handleCountryDraftChange}
            onOpenChange={handleCountryPanelOpenChange}
            onPanelClose={handleCountryPanelClose}
          />
        </div>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-2">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">Регион</span>
          <select
            value={regionKey}
            onChange={(e) => onRegionKey(e.target.value)}
            disabled={regionDisabled}
            className={`${compactInput} disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400`}
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
            className={compactInput}
          >
            {priceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
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
            className={compactInput}
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
            className={compactInput}
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1 lg:col-span-1">
          <span className="text-[11px] font-medium text-zinc-600 sm:text-xs">
            {ratingLabel}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={ratingMin}
            onChange={(e) => onRatingMin(e.target.value)}
            placeholder="—"
            className={compactInput}
          />
        </label>
      </div>
      </div>
    </div>
  );
}
