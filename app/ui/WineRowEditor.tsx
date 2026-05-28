"use client";

import { useEffect, useMemo, useState } from "react";
import type { Wine, WineColor } from "../../lib/wines";
import {
  WINE_CURRENCY_OTHER_VALUE,
  WINE_CURRENCY_PRESETS,
} from "../../lib/wineCurrencies";
import {
  getCanonicalCountries,
  WINE_COUNTRY_OTHER_VALUE,
  WINE_REGION_OTHER_VALUE,
} from "../../lib/wineNormalize";
import {
  formStateToUpdateBody,
  regionSelectFromWine,
  resolveFormGeo,
  validateWineForm,
  wineToFormState,
  type WineFormState,
} from "../../lib/wineFormShared";

const inputClass =
  "h-8 w-full rounded border border-zinc-200 bg-white px-2 text-[11px] text-zinc-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100";
const selectClass = `${inputClass} disabled:cursor-not-allowed disabled:bg-zinc-50`;

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-0.5 block text-[10px] font-semibold text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export function WineRowEditor({
  wine,
  countryOptions: countryOptionsProp,
  onSave,
  onCancel,
  saving = false,
}: {
  wine: Wine;
  countryOptions: string[];
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}) {
  const canonicalCountries = useMemo(() => getCanonicalCountries(), []);

  const countryOptions = useMemo(() => {
    const names = new Set<string>();
    for (const c of canonicalCountries) names.add(c.name);
    for (const c of countryOptionsProp) if (c.trim()) names.add(c.trim());
    const wCountry = wine.country?.trim();
    if (wCountry) names.add(wCountry);
    return [...names].sort((a, b) => a.localeCompare(b, "ru"));
  }, [canonicalCountries, countryOptionsProp, wine.country]);

  const [form, setForm] = useState<WineFormState>(() =>
    wineToFormState(wine, countryOptions, []),
  );
  const [regionOptions, setRegionOptions] = useState<string[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { country: resolvedCountry, region: resolvedRegion, isCountryOther } =
    resolveFormGeo(form);

  const validationError = useMemo(
    () => validateWineForm(form, resolvedCountry, resolvedRegion),
    [form, resolvedCountry, resolvedRegion],
  );

  const patch = (partial: Partial<WineFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setSubmitError(null);
  };

  useEffect(() => {
    setForm(wineToFormState(wine, countryOptions, regionOptions));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when wine row changes
  }, [wine.id]);

  useEffect(() => {
    if (!resolvedCountry || isCountryOther) {
      setRegionOptions([]);
      return;
    }
    let cancelled = false;
    setRegionsLoading(true);
    void fetch(
      `/api/wines/facets?drank=false&country=${encodeURIComponent(resolvedCountry)}`,
      { cache: "no-store" },
    )
      .then((r) => r.json())
      .then((d: { regions?: string[] }) => {
        if (!cancelled) {
          const regions = d.regions ?? [];
          setRegionOptions(regions);
          setForm((prev) => {
            const r = wine.region?.trim();
            if (!r || prev.regionSelect) return prev;
            const { select, other } = regionSelectFromWine(wine.region, regions);
            return { ...prev, regionSelect: select, regionOther: other };
          });
        }
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
  }, [resolvedCountry, isCountryOther, wine, countryOptions]);

  const isRegionOther = form.regionSelect === WINE_REGION_OTHER_VALUE;

  return (
    <form
      className="rounded-lg border border-rose-100 bg-rose-50/40 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const err = validateWineForm(form, resolvedCountry, resolvedRegion);
        if (err) {
          setSubmitError(err);
          return;
        }
        void onSave(formStateToUpdateBody(form)).catch((ex) => {
          setSubmitError(ex instanceof Error ? ex.message : String(ex));
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <Field label="Название *">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </Field>
        <Field label="Производитель *">
          <input
            className={inputClass}
            value={form.producer}
            onChange={(e) => patch({ producer: e.target.value })}
          />
        </Field>
        <Field label="Цвет *">
          <select
            className={selectClass}
            value={form.color}
            onChange={(e) => patch({ color: e.target.value as WineColor })}
          >
            <option value="red">Красное</option>
            <option value="white">Белое</option>
            <option value="rose">Розовое</option>
            <option value="sparkling">Игристое</option>
          </select>
        </Field>
        <Field label="Год *">
          <input
            className={inputClass}
            value={form.year}
            onChange={(e) => patch({ year: e.target.value })}
            placeholder="2021 или N.V."
          />
        </Field>
        <Field label="Страна *">
          <select
            className={selectClass}
            value={form.countrySelect}
            onChange={(e) =>
              patch({
                countrySelect: e.target.value,
                regionSelect: "",
                regionOther: "",
              })
            }
          >
            <option value="">—</option>
            {countryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value={WINE_COUNTRY_OTHER_VALUE}>Другое</option>
          </select>
          {isCountryOther ? (
            <input
              className={`${inputClass} mt-1`}
              value={form.countryOther}
              onChange={(e) => patch({ countryOther: e.target.value })}
              placeholder="Страна"
            />
          ) : null}
        </Field>
        <Field label="Регион *">
          {isCountryOther ? (
            <input
              className={inputClass}
              value={form.regionOther}
              onChange={(e) => patch({ regionOther: e.target.value })}
            />
          ) : !resolvedCountry ? (
            <input className={inputClass} disabled placeholder="Страна" />
          ) : (
            <>
              <select
                className={selectClass}
                value={form.regionSelect}
                onChange={(e) =>
                  patch({ regionSelect: e.target.value, regionOther: "" })
                }
                disabled={regionsLoading}
              >
                <option value="">{regionsLoading ? "…" : "—"}</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value={WINE_REGION_OTHER_VALUE}>Другое</option>
              </select>
              {isRegionOther ? (
                <input
                  className={`${inputClass} mt-1`}
                  value={form.regionOther}
                  onChange={(e) => patch({ regionOther: e.target.value })}
                />
              ) : null}
            </>
          )}
        </Field>
        <Field label="Апелласьон">
          <input
            className={inputClass}
            value={form.subregion}
            onChange={(e) => patch({ subregion: e.target.value })}
          />
        </Field>
        <Field label="Сорт">
          <input
            className={inputClass}
            value={form.grape}
            onChange={(e) => patch({ grape: e.target.value })}
          />
        </Field>
        <Field label="VV">
          <div className="flex h-8 overflow-hidden rounded border border-zinc-200 bg-white focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100">
            <span className="flex shrink-0 items-center pl-2 text-[10px] font-semibold text-zinc-500">
              VV
            </span>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent px-1 text-[11px] outline-none"
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
            />
          </div>
        </Field>
        <Field label="Кол-во *">
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.quantity}
            onChange={(e) => patch({ quantity: e.target.value })}
          />
        </Field>
        <Field label="Покупка *">
          <input
            className={inputClass}
            inputMode="decimal"
            value={form.purchasePrice}
            onChange={(e) => patch({ purchasePrice: e.target.value })}
          />
        </Field>
        <Field label="Вал. покупки *">
          <select
            className={selectClass}
            value={form.purchaseCurrencyKey}
            onChange={(e) => patch({ purchaseCurrencyKey: e.target.value })}
          >
            {WINE_CURRENCY_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
            <option value={WINE_CURRENCY_OTHER_VALUE}>Другое</option>
          </select>
          {form.purchaseCurrencyKey === WINE_CURRENCY_OTHER_VALUE ? (
            <input
              className={`${inputClass} mt-1`}
              value={form.purchaseCurrencyOther}
              onChange={(e) => patch({ purchaseCurrencyOther: e.target.value })}
              maxLength={8}
            />
          ) : null}
        </Field>
        <Field label="Израиль">
          <input
            className={inputClass}
            inputMode="decimal"
            value={form.israelPrice}
            onChange={(e) => patch({ israelPrice: e.target.value })}
          />
        </Field>
        <Field label="Оригинал *">
          <input
            className={inputClass}
            inputMode="decimal"
            value={form.originPrice}
            onChange={(e) => patch({ originPrice: e.target.value })}
          />
        </Field>
        <Field label="Вал. оригинала *">
          <select
            className={selectClass}
            value={form.originCurrencyKey}
            onChange={(e) => patch({ originCurrencyKey: e.target.value })}
          >
            {WINE_CURRENCY_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
            <option value={WINE_CURRENCY_OTHER_VALUE}>Другое</option>
          </select>
          {form.originCurrencyKey === WINE_CURRENCY_OTHER_VALUE ? (
            <input
              className={`${inputClass} mt-1`}
              value={form.originCurrencyOther}
              onChange={(e) => patch({ originCurrencyOther: e.target.value })}
              maxLength={8}
            />
          ) : null}
        </Field>
        <Field label="Дата *">
          <input
            type="date"
            className={inputClass}
            value={form.purchaseDate}
            onChange={(e) => patch({ purchaseDate: e.target.value })}
          />
        </Field>
        <Field label="Заметка" className="sm:col-span-2">
          <input
            className={inputClass}
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </Field>
      </div>

      {(submitError ?? validationError) ? (
        <p className="mt-2 text-[11px] text-rose-700">
          {submitError ?? validationError}
        </p>
      ) : null}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={saving || validationError != null}
          className="rounded bg-rose-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </form>
  );
}
