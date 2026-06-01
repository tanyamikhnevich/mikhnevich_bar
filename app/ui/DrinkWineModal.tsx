"use client";

import { useMemo, useState } from "react";
import type { Wine } from "@/lib/wines";
import { formatDrankRating, parseDrankRating } from "@/lib/wineDrankRating";

export type DrinkWineConfirmInput = {
  quantity: number;
  drankRating?: number | null;
  drankNotes?: string | null;
};

function bottleLabel(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "бутылка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "бутылки";
  return "бутылок";
}

export function DrinkWineModal({
  wine,
  onClose,
  onConfirm,
}: {
  wine: Wine | null;
  onClose: () => void;
  onConfirm: (input: DrinkWineConfirmInput) => void | Promise<void>;
}) {
  if (!wine) return null;

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-4 py-4 sm:px-6 sm:py-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Отметить выпитым</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {wine.name}
            {wine.producer ? ` · ${wine.producer}` : ""}
            {wine.year?.trim() ? ` · ${wine.year}` : ""}
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
      <DrinkWineForm
        key={wine.id}
        wine={wine}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </ModalShell>
  );
}

function DrinkWineForm({
  wine,
  onClose,
  onConfirm,
}: {
  wine: Wine;
  onClose: () => void;
  onConfirm: (input: DrinkWineConfirmInput) => void | Promise<void>;
}) {
  const maxQty = wine.quantity;
  const [amount, setAmount] = useState("1");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => {
    const n = Number(amount.replace(",", "."));
    return Number.isFinite(n) ? Math.round(n) : NaN;
  }, [amount]);

  const parsedRating = useMemo(() => {
    const t = rating.trim();
    if (!t) return null;
    const parsed = parseDrankRating(t);
    return parsed === null ? NaN : parsed;
  }, [rating]);

  const valid = Number.isFinite(parsed) && parsed >= 1 && parsed <= maxQty;
  const ratingValid = parsedRating === null || !Number.isNaN(parsedRating);

  const submit = (skipMeta: boolean) => {
    if (!valid || !ratingValid || submitting) return;
    setSubmitting(true);
    const input: DrinkWineConfirmInput = { quantity: parsed };
    if (!skipMeta) {
      if (parsedRating != null) input.drankRating = parsedRating;
      const trimmedNotes = notes.trim();
      if (trimmedNotes) input.drankNotes = trimmedNotes;
    }
    void Promise.resolve(onConfirm(input))
      .then(() => onClose())
      .finally(() => setSubmitting(false));
  };

  return (
    <form
      className="px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5 sm:pb-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      <p className="text-sm text-zinc-600">
        В коллекции <span className="font-medium text-zinc-900">{maxQty}</span>{" "}
        {bottleLabel(maxQty)}. Сколько отметить выпитым?
      </p>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-semibold text-zinc-700">Количество</span>
        <input
          type="number"
          min={1}
          max={maxQty}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-10 w-full max-w-[8rem] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          autoFocus
        />
      </label>

      {!valid && amount.trim() !== "" ? (
        <p className="mt-2 text-xs text-red-600">От 1 до {maxQty}</p>
      ) : null}

      <div className="mt-5 border-t border-zinc-100 pt-4">
        <p className="text-xs font-semibold text-zinc-700">Впечатления (необязательно)</p>
        <label className="mt-2 block">
          <span className="mb-1 block text-[11px] font-medium text-zinc-600">
            Моя оценка (0–10)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="—"
            className="h-9 w-full max-w-[6rem] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          />
        </label>
        {!ratingValid ? (
          <p className="mt-1 text-xs text-red-600">Оценка от 0 до 10, например 9,4</p>
        ) : null}

        <label className="mt-3 block">
          <span className="mb-1 block text-[11px] font-medium text-zinc-600">Заметки</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Что запомнилось…"
            className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 active:bg-zinc-50 sm:order-1 sm:rounded-lg sm:px-4 sm:py-2"
        >
          Отмена
        </button>
        <button
          type="button"
          disabled={!valid || submitting}
          onClick={() => submit(true)}
          className="min-h-11 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-800 active:bg-zinc-100 disabled:opacity-50 sm:order-2 sm:rounded-lg sm:px-4 sm:py-2"
        >
          Пропустить
        </button>
        <button
          type="submit"
          disabled={!valid || !ratingValid || submitting}
          className="min-h-11 rounded-xl bg-rose-700 text-sm font-semibold text-white active:bg-rose-800 disabled:opacity-50 sm:order-3 sm:rounded-lg sm:px-4 sm:py-2"
        >
          {submitting ? "Сохранение…" : "Выпить"}
        </button>
      </div>
    </form>
  );
}

function ModalShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        {children}
      </div>
    </div>
  );
}
