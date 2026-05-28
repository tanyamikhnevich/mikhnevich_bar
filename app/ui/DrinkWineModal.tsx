"use client";

import { useMemo, useState } from "react";
import type { Wine } from "../../lib/wines";

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
  onConfirm: (quantity: number) => void | Promise<void>;
}) {
  if (!wine) return null;

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
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
  onConfirm: (quantity: number) => void | Promise<void>;
}) {
  const maxQty = wine.quantity;
  const [amount, setAmount] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => {
    const n = Number(amount.replace(",", "."));
    return Number.isFinite(n) ? Math.round(n) : NaN;
  }, [amount]);

  const valid = Number.isFinite(parsed) && parsed >= 1 && parsed <= maxQty;

  return (
    <form
      className="px-6 py-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || submitting) return;
        setSubmitting(true);
        void Promise.resolve(onConfirm(parsed))
          .then(() => onClose())
          .finally(() => setSubmitting(false));
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

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={!valid || submitting}
          className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">{children}</div>
    </div>
  );
}
