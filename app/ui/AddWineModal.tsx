"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewWineInput, Wine, WineColor } from "@/lib/wines";
import {
  WINE_CURRENCY_OTHER_VALUE,
  WINE_CURRENCY_PRESETS,
  resolveWineCurrencySymbol,
} from "@/lib/wineCurrencies";
import {
  canonicalCountryCode,
  getCanonicalCountries,
  WINE_COUNTRY_OTHER_VALUE,
  WINE_REGION_OTHER_VALUE,
} from "@/lib/wineNormalize";
import { wineToAddFormDefaults } from "@/lib/wineAddTemplate";
import {
  getWineYearInputError,
  parseVintageFromFormInput,
  WINE_VINTAGE_NV,
} from "@/lib/wineVintage";

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-zinc-700">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </div>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none",
        "focus:border-rose-300 focus:ring-4 focus:ring-rose-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none",
        "focus:border-rose-300 focus:ring-4 focus:ring-rose-100",
        "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput {...props} inputMode="decimal" />;
}

function todayISODateLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function createEmptyForm() {
  return {
    name: "",
    producer: "",
    year: "",
    countrySelect: "",
    countryOther: "",
    regionSelect: "",
    regionOther: "",
    subregion: "",
    grape: "",
    purchasePrice: "",
    purchaseCurrencyKey: "ILS",
    purchaseCurrencyOther: "",
    originPrice: "",
    originCurrencyKey: "ILS",
    originCurrencyOther: "",
    israelPrice: "",
    purchaseDate: todayISODateLocal(),
    vvScore: "",
    quantity: "1",
    color: "red" as WineColor,
    notes: "",
  };
}

type FormState = ReturnType<typeof createEmptyForm>;

function parsePositiveInt(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  return rounded >= 1 ? rounded : null;
}

function parsePositivePrice(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function formatRatingsFromVvScore(score: string): string | null {
  const t = score.trim().replace(",", ".");
  if (!t) return null;
  return `VV ${t}`;
}

function CurrencyField({
  label,
  required,
  currencyKey,
  currencyOther,
  onKeyChange,
  onOtherChange,
}: {
  label: string;
  required?: boolean;
  currencyKey: string;
  currencyOther: string;
  onKeyChange: (key: string) => void;
  onOtherChange: (text: string) => void;
}) {
  const isOther = currencyKey === WINE_CURRENCY_OTHER_VALUE;
  return (
    <Field label={label} required={required}>
      <Select value={currencyKey} onChange={(e) => onKeyChange(e.target.value)}>
        {WINE_CURRENCY_PRESETS.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
        <option value={WINE_CURRENCY_OTHER_VALUE}>Другое</option>
      </Select>
      {isOther ? (
        <TextInput
          className="mt-2"
          value={currencyOther}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Символ или код валюты"
          maxLength={8}
        />
      ) : null}
    </Field>
  );
}

function validateForm(
  form: FormState,
  resolvedCountry: string,
  resolvedRegion: string,
): string | null {
  if (!form.name.trim()) return "Укажите название";
  if (!form.producer.trim()) return "Укажите производителя";
  const yearError = getWineYearInputError(form.year);
  if (yearError) return yearError;
  if (!form.countrySelect) return "Выберите страну";
  if (form.countrySelect === WINE_COUNTRY_OTHER_VALUE && !form.countryOther.trim()) {
    return "Укажите название страны";
  }
  if (!resolvedCountry) return "Укажите страну";
  if (!resolvedRegion) return "Укажите регион";
  if (!parsePositiveInt(form.quantity)) return "Укажите количество бутылок (от 1)";
  if (parsePositivePrice(form.purchasePrice) == null) return "Укажите цену покупки";
  const purchaseCur = resolveWineCurrencySymbol(
    form.purchaseCurrencyKey,
    form.purchaseCurrencyOther,
  );
  if (!purchaseCur) return "Выберите валюту покупки";
  if (parsePositivePrice(form.originPrice) == null) return "Укажите цену в стране (оригинал)";
  const originCur = resolveWineCurrencySymbol(
    form.originCurrencyKey,
    form.originCurrencyOther,
  );
  if (!originCur) return "Выберите валюту (оригинал)";
  if (!form.purchaseDate.trim()) return "Укажите дату покупки";
  return null;
}

export function AddWineModal({
  open,
  onClose,
  onSubmit,
  copyFrom,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (wine: NewWineInput) => void | Promise<void>;
  /** Заполнить форму данными скопированного вина */
  copyFrom?: Wine | null;
}) {
  const [form, setForm] = useState(createEmptyForm);
  const [dbCountries, setDbCountries] = useState<string[]>([]);
  const [regionOptions, setRegionOptions] = useState<string[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [yearTouched, setYearTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const canonicalCountries = useMemo(() => getCanonicalCountries(), []);

  const countryOptions = useMemo(() => {
    const names = new Set<string>();
    for (const c of canonicalCountries) names.add(c.name);
    for (const c of dbCountries) if (c.trim()) names.add(c.trim());
    return [...names].sort((a, b) => a.localeCompare(b, "ru"));
  }, [canonicalCountries, dbCountries]);

  const isCountryOther = form.countrySelect === WINE_COUNTRY_OTHER_VALUE;
  const resolvedCountry = isCountryOther
    ? form.countryOther.trim()
    : form.countrySelect.trim();

  const isRegionOther = form.regionSelect === WINE_REGION_OTHER_VALUE;
  const resolvedRegion = isCountryOther
    ? form.regionOther.trim()
    : isRegionOther
      ? form.regionOther.trim()
      : form.regionSelect.trim();

  const validationError = useMemo(
    () => validateForm(form, resolvedCountry, resolvedRegion),
    [form, resolvedCountry, resolvedRegion],
  );

  const yearError = useMemo(() => getWineYearInputError(form.year), [form.year]);
  const showYearError = yearTouched || submitAttempted;
  const nonYearValidationError = useMemo(() => {
    if (!validationError || validationError === yearError) return null;
    return validationError;
  }, [validationError, yearError]);

  const canSubmit = validationError == null && !submitting;

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      if (copyFrom) {
        setForm({ ...createEmptyForm(), ...wineToAddFormDefaults(copyFrom) });
      } else {
        setForm(createEmptyForm());
      }
      setRegionOptions([]);
      setSubmitError(null);
      setSubmitting(false);
      setYearTouched(false);
      setSubmitAttempted(false);
    });
    void fetch("/api/wines/facets?drank=false", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { countries?: string[] }) => setDbCountries(d.countries ?? []))
      .catch(() => setDbCountries([]));
  }, [open, copyFrom]);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !resolvedCountry || isCountryOther) {
      queueMicrotask(() => setRegionOptions([]));
      return;
    }
    let cancelled = false;
    queueMicrotask(() => setRegionsLoading(true));
    void fetch(
      `/api/wines/facets?drank=false&country=${encodeURIComponent(resolvedCountry)}`,
      { cache: "no-store" },
    )
      .then((r) => r.json())
      .then((d: { regions?: string[] }) => {
        if (!cancelled) setRegionOptions(d.regions ?? []);
      })
      .catch(() => {
        if (!cancelled) setRegionOptions([]);
      })
      .finally(() => {
        if (!cancelled) setRegionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, resolvedCountry, isCountryOther]);

  const patch = (partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setSubmitError(null);
  };

  useEffect(() => {
    if (!open || regionsLoading || isCountryOther) return;
    const r = form.regionSelect.trim();
    if (!r || r === WINE_REGION_OTHER_VALUE) return;
    if (regionOptions.length > 0 && !regionOptions.includes(r)) {
      patch({ regionSelect: WINE_REGION_OTHER_VALUE, regionOther: r });
    }
  }, [open, regionsLoading, isCountryOther, regionOptions, form.regionSelect]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-wine-title"
    >
      <div className="flex max-h-[min(92dvh,42rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[min(90vh,42rem)] sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="add-wine-title" className="text-lg font-semibold text-zinc-900">
              Добавить вино
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {copyFrom
                ? `На основе «${copyFrom.name.trim()}» — измените нужные поля`
                : "Поля со звёздочкой обязательны"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitAttempted(true);
            const err = validateForm(form, resolvedCountry, resolvedRegion);
            if (err) return;
            if (submitting) return;

            const purchaseCurrency = resolveWineCurrencySymbol(
              form.purchaseCurrencyKey,
              form.purchaseCurrencyOther,
            );
            const originCurrency = resolveWineCurrencySymbol(
              form.originCurrencyKey,
              form.originCurrencyOther,
            );
            const ratings = formatRatingsFromVvScore(form.vvScore);
            const israelPrice = form.israelPrice.trim()
              ? parsePositivePrice(form.israelPrice)
              : null;

            setSubmitting(true);
            setSubmitError(null);
            void Promise.resolve(
              onSubmit({
                name: form.name.trim(),
                producer: form.producer.trim(),
                year: parseVintageFromFormInput(form.year),
                country: resolvedCountry,
                countryCode: isCountryOther
                  ? ""
                  : canonicalCountryCode(form.countrySelect) ?? "",
                region: resolvedRegion,
                subregion: form.subregion.trim() || "",
                grape: form.grape.trim() || "",
                ratings,
                purchasePrice: parsePositivePrice(form.purchasePrice),
                purchaseCurrency,
                originPrice: parsePositivePrice(form.originPrice),
                originCurrency,
                israelPrice,
                israelCurrency: israelPrice != null ? "₪" : null,
                isGuestVisible: false,
                guestBottlePrice: null,
                guestGlassPrice: null,
                purchaseDate: form.purchaseDate.trim() || null,
                vivinoRating: null,
                quantity: parsePositiveInt(form.quantity) ?? 1,
                color: form.color,
                drank: false,
                notes: form.notes.trim() || null,
              }),
            )
              .catch((ex: unknown) => {
                setSubmitError(ex instanceof Error ? ex.message : String(ex));
              })
              .finally(() => {
                setSubmitting(false);
              });
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <Field label="Название" required>
                <TextInput
                  value={form.name}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </Field>

              <Field label="Производитель" required>
                <TextInput
                  value={form.producer}
                  onChange={(e) => patch({ producer: e.target.value })}
                />
              </Field>

              <Field label="Цвет" required>
                <Select
                  value={form.color}
                  onChange={(e) => patch({ color: e.target.value as WineColor })}
                >
                  <option value="red">Красное</option>
                  <option value="white">Белое</option>
                  <option value="rose">Розовое</option>
                  <option value="sparkling">Игристое</option>
                </Select>
              </Field>

              <Field label="Год" required>
                <div className="flex gap-2">
                  <TextInput
                    className={[
                      "min-w-0 flex-1",
                      showYearError && yearError
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "",
                    ].join(" ")}
                    value={form.year === WINE_VINTAGE_NV ? "" : form.year}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      patch({ year: digits });
                    }}
                    onBlur={() => setYearTouched(true)}
                    placeholder="2021"
                    inputMode="numeric"
                    disabled={form.year === WINE_VINTAGE_NV || submitting}
                    aria-invalid={showYearError && yearError != null}
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setYearTouched(true);
                      patch({
                        year: form.year === WINE_VINTAGE_NV ? "" : WINE_VINTAGE_NV,
                      });
                    }}
                    className={[
                      "shrink-0 rounded-lg border px-3 text-sm font-semibold transition-colors",
                      form.year === WINE_VINTAGE_NV
                        ? "border-rose-300 bg-rose-50 text-rose-800"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                      submitting ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                    title="Нет винтажа (No Vintage)"
                  >
                    {WINE_VINTAGE_NV}
                  </button>
                </div>
                {showYearError && yearError ? (
                  <p className="mt-1 text-xs text-rose-700">{yearError}</p>
                ) : null}
              </Field>

              <Field label="Страна" required>
                <Select
                  value={form.countrySelect}
                  onChange={(e) => {
                    patch({
                      countrySelect: e.target.value,
                      regionSelect: "",
                      regionOther: "",
                    });
                  }}
                >
                  <option value="">—</option>
                  {countryOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value={WINE_COUNTRY_OTHER_VALUE}>Другое</option>
                </Select>
                {isCountryOther ? (
                  <TextInput
                    className="mt-2"
                    value={form.countryOther}
                    onChange={(e) => patch({ countryOther: e.target.value })}
                    placeholder="Название страны"
                  />
                ) : null}
              </Field>

              <Field label="Регион" required>
                {isCountryOther ? (
                  <TextInput
                    value={form.regionOther}
                    onChange={(e) => patch({ regionOther: e.target.value })}
                    placeholder="Регион"
                  />
                ) : !resolvedCountry ? (
                  <TextInput disabled placeholder="Сначала выберите страну" />
                ) : (
                  <>
                    <Select
                      value={form.regionSelect}
                      onChange={(e) =>
                        patch({ regionSelect: e.target.value, regionOther: "" })
                      }
                      disabled={regionsLoading}
                    >
                      <option value="">
                        {regionsLoading ? "Загрузка…" : "—"}
                      </option>
                      {regionOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                      <option value={WINE_REGION_OTHER_VALUE}>Другое</option>
                    </Select>
                    {isRegionOther ? (
                      <TextInput
                        className="mt-2"
                        value={form.regionOther}
                        onChange={(e) => patch({ regionOther: e.target.value })}
                        placeholder="Название региона"
                      />
                    ) : null}
                  </>
                )}
              </Field>

              <Field label="Апелласьон">
                <TextInput
                  value={form.subregion}
                  onChange={(e) => patch({ subregion: e.target.value })}
                  placeholder="Марго"
                />
              </Field>

              <Field label="Сорт винограда">
                <TextInput
                  value={form.grape}
                  onChange={(e) => patch({ grape: e.target.value })}
                />
              </Field>

              <Field label="Ratings (Vivino)">
                <div className="flex h-10 w-full items-center overflow-hidden rounded-lg border border-zinc-200 bg-white focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-100">
                  <span className="shrink-0 pl-3 text-sm font-semibold text-zinc-500">
                    VV
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.vvScore}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.,]/g, "");
                      const normalized = raw.replace(",", ".");
                      const parts = normalized.split(".");
                      const score =
                        parts.length > 2
                          ? `${parts[0]}.${parts.slice(1).join("")}`
                          : normalized;
                      patch({ vvScore: score });
                    }}
                    placeholder="4.6"
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-zinc-900 outline-none"
                  />
                </div>
              </Field>

              <Field label="Кол-во бутылок" required>
                <NumberInput
                  value={form.quantity}
                  onChange={(e) => patch({ quantity: e.target.value })}
                />
              </Field>

              <Field label="Цена покупки" required>
                <NumberInput
                  value={form.purchasePrice}
                  onChange={(e) => patch({ purchasePrice: e.target.value })}
                />
              </Field>

              <CurrencyField
                label="Валюта покупки"
                required
                currencyKey={form.purchaseCurrencyKey}
                currencyOther={form.purchaseCurrencyOther}
                onKeyChange={(purchaseCurrencyKey) => patch({ purchaseCurrencyKey })}
                onOtherChange={(purchaseCurrencyOther) =>
                  patch({ purchaseCurrencyOther })
                }
              />

              <Field label="Цена в Израиле">
                <NumberInput
                  value={form.israelPrice}
                  onChange={(e) => patch({ israelPrice: e.target.value })}
                />
              </Field>

              <Field label="Цена в стране (оригинал)" required>
                <NumberInput
                  value={form.originPrice}
                  onChange={(e) => patch({ originPrice: e.target.value })}
                />
              </Field>

              <CurrencyField
                label="Валюта (оригинал)"
                required
                currencyKey={form.originCurrencyKey}
                currencyOther={form.originCurrencyOther}
                onKeyChange={(originCurrencyKey) => patch({ originCurrencyKey })}
                onOtherChange={(originCurrencyOther) =>
                  patch({ originCurrencyOther })
                }
              />

              <Field label="Дата покупки" required>
                <TextInput
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => patch({ purchaseDate: e.target.value })}
                />
              </Field>

              <Field label="Заметка">
                <TextInput
                  value={form.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div className="shrink-0 border-t border-zinc-200 px-5 py-4 sm:px-6">
            {submitError || (submitAttempted && nonYearValidationError) ? (
              <p className="mb-3 text-sm text-rose-700">
                {submitError ?? nonYearValidationError}
              </p>
            ) : null}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white",
                  canSubmit
                    ? "bg-rose-700 hover:bg-rose-800"
                    : "cursor-not-allowed bg-zinc-300",
                ].join(" ")}
              >
                {submitting ? (
                  <>
                    <span
                      className="inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden
                    />
                    Добавление…
                  </>
                ) : (
                  "Добавить"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
