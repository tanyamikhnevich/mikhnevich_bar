"use client";

import { useMemo, useState } from "react";
import type { Wine } from "@/lib/wines";
import { formatDrankRating, parseDrankRating } from "@/lib/wineDrankRating";

export type EditDrankMetaInput = {
  drankRating: number | null;
  drankNotes: string | null;
};

export function EditDrankMetaModal({
  wine,
  initialRating,
  initialNotes,
  onClose,
  onSave,
}: {
  wine: Wine | null;
  initialRating: number | null;
  initialNotes: string | null;
  onClose: () => void;
  onSave: (input: EditDrankMetaInput) => void | Promise<void>;
}) {
  if (!wine) return null;

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-4 py-4 sm:px-6 sm:py-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Оценка и заметки</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {wine.name}
            {wine.producer ? ` · ${wine.producer}` : ""}
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
      <EditDrankMetaForm
        key={wine.id}
        initialRating={initialRating}
        initialNotes={initialNotes}
        onClose={onClose}
        onSave={onSave}
      />
    </ModalShell>
  );
}

function EditDrankMetaForm({
  initialRating,
  initialNotes,
  onClose,
  onSave,
}: {
  initialRating: number | null;
  initialNotes: string | null;
  onClose: () => void;
  onSave: (input: EditDrankMetaInput) => void | Promise<void>;
}) {
  const [rating, setRating] = useState(
    initialRating != null ? String(initialRating).replace(".", ",") : "",
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [submitting, setSubmitting] = useState(false);

  const parsedRating = useMemo(() => {
    const t = rating.trim();
    if (!t) return null;
    const parsed = parseDrankRating(t);
    return parsed === null ? NaN : parsed;
  }, [rating]);

  const ratingValid = parsedRating === null || !Number.isNaN(parsedRating);

  return (
    <form
      className="px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5 sm:pb-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ratingValid || submitting) return;
        setSubmitting(true);
        void Promise.resolve(
          onSave({
            drankRating: parsedRating,
            drankNotes: notes.trim() || null,
          }),
        )
          .then(() => onClose())
          .finally(() => setSubmitting(false));
      }}
    >
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-zinc-700">
          Моя оценка (0–10)
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          placeholder="—"
          className="h-10 w-full max-w-[8rem] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          autoFocus
        />
        {!ratingValid ? (
          <p className="mt-1 text-xs text-red-600">Оценка от 0 до 10, например 9,4</p>
        ) : parsedRating != null ? (
          <p className="mt-1 text-xs text-zinc-500">
            Будет сохранено: {formatDrankRating(parsedRating)}
          </p>
        ) : null}
      </label>

      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-semibold text-zinc-700">Заметки</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Что запомнилось…"
          className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
        />
      </label>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 active:bg-zinc-50 sm:rounded-lg sm:px-4 sm:py-2"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={!ratingValid || submitting}
          className="min-h-11 rounded-xl bg-rose-700 text-sm font-semibold text-white active:bg-rose-800 disabled:opacity-50 sm:rounded-lg sm:px-4 sm:py-2"
        >
          {submitting ? "Сохранение…" : "Сохранить"}
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
