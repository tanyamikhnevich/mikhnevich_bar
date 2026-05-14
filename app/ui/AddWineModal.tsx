"use client";

import { useMemo, useState } from "react";
import type { NewWineInput, WineColor } from "../../lib/wines";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-zinc-700">{label}</div>
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
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput {...props} inputMode="decimal" />;
}

function normalizeISODate(value: string) {
  if (!value) return null;
  return value;
}

export function AddWineModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (wine: NewWineInput) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [producer, setProducer] = useState("");
  const [year, setYear] = useState<string>("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [region, setRegion] = useState("");
  const [subregion, setSubregion] = useState("");
  const [grape, setGrape] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [purchaseCurrency, setPurchaseCurrency] = useState<string>("");
  const [originPrice, setOriginPrice] = useState<string>("");
  const [originCurrency, setOriginCurrency] = useState<string>("");
  const [israelPrice, setIsraelPrice] = useState<string>("");
  const [israelCurrency, setIsraelCurrency] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [ratings, setRatings] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [color, setColor] = useState<WineColor>("red");
  const [notes, setNotes] = useState("");

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && producer.trim().length > 0;
  }, [name, producer]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Добавить вино
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Заполните информацию о новом вине в коллекции
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <form
          className="px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;

            void onSubmit({
              name: name.trim(),
              producer: producer.trim(),
              year: year ? Number(year) : null,
              country: country.trim() || "",
              countryCode: countryCode.trim().toUpperCase() || "",
              region: region.trim() || "",
              subregion: subregion.trim() || "",
              grape: grape.trim() || "",
              ratings: ratings.trim() || null,
              purchasePrice: purchasePrice ? Number(purchasePrice) : null,
              purchaseCurrency: purchaseCurrency.trim() || null,
              originPrice: originPrice ? Number(originPrice) : null,
              originCurrency: originCurrency.trim() || null,
              israelPrice: israelPrice ? Number(israelPrice) : null,
              israelCurrency: israelCurrency.trim() || null,
              guestPrice: null,
              purchaseDate: normalizeISODate(purchaseDate),
              vivinoRating: null,
              quantity: quantity ? Number(quantity) : 1,
              color,
              drank: false,
              notes: notes.trim() || null,
            });
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Название">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>

            <Field label="Производитель">
              <TextInput
                value={producer}
                onChange={(e) => setProducer(e.target.value)}
              />
            </Field>

            <Field label="Цвет">
              <Select
                value={color}
                onChange={(e) => setColor(e.target.value as WineColor)}
              >
                <option value="red">Красное</option>
                <option value="white">Белое</option>
                <option value="rose">Розовое</option>
                <option value="sparkling">Игристое</option>
              </Select>
            </Field>

            <Field label="Год">
              <NumberInput
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2021"
              />
            </Field>

            <Field label="Страна">
              <TextInput
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Франция"
              />
            </Field>

            <Field label="Код страны">
              <TextInput
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                placeholder="FR"
              />
            </Field>

            <Field label="Регион">
              <TextInput
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Бордо"
              />
            </Field>

            <Field label="Апелласьон">
              <TextInput
                value={subregion}
                onChange={(e) => setSubregion(e.target.value)}
                placeholder="Марго"
              />
            </Field>

            <Field label="Сорт винограда">
              <TextInput
                value={grape}
                onChange={(e) => setGrape(e.target.value)}
                placeholder="Каберне Совиньон"
              />
            </Field>

            <Field label="Ratings">
              <TextInput
                value={ratings}
                onChange={(e) => setRatings(e.target.value)}
                placeholder="VV 4.6"
              />
            </Field>

            <Field label="Кол-во бутылок">
              <NumberInput
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>

            <Field label="Цена покупки">
              <NumberInput
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </Field>

            <Field label="Валюта покупки">
              <TextInput
                value={purchaseCurrency}
                onChange={(e) => setPurchaseCurrency(e.target.value)}
                placeholder="₪"
                maxLength={8}
              />
            </Field>

            <Field label="Цена в Израиле">
              <NumberInput
                value={israelPrice}
                onChange={(e) => setIsraelPrice(e.target.value)}
              />
            </Field>

            <Field label="Валюта (Израиль)">
              <TextInput
                value={israelCurrency}
                onChange={(e) => setIsraelCurrency(e.target.value)}
                placeholder="₪"
                maxLength={8}
              />
            </Field>

            <Field label="Цена в стране (оригинал)">
              <NumberInput
                value={originPrice}
                onChange={(e) => setOriginPrice(e.target.value)}
              />
            </Field>

            <Field label="Валюта (оригинал)">
              <TextInput
                value={originCurrency}
                onChange={(e) => setOriginCurrency(e.target.value)}
                placeholder="€"
                maxLength={8}
              />
            </Field>

            <Field label="Дата покупки">
              <TextInput
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </Field>

            <Field label="Заметка">
              <TextInput
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Вкус/впечатления/к чему подходит"
              />
            </Field>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold text-white",
                canSubmit
                  ? "bg-rose-700 hover:bg-rose-800"
                  : "bg-zinc-300 cursor-not-allowed",
              ].join(" ")}
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

